import type { FC, PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { ListItem } from './ListItem';
import { InertiaScroller } from '../physics/InertiaScroller';
import { VelocityTracker } from '../physics/VelocityTracker';
import { Config } from '../config/Config';
import { clamp } from '../utils/device';
import { useNavigate } from 'react-router-dom';
import { gamesConfig } from '../config/Games';

export interface ScrollableListProps {
    className?: string;
}

interface Geometry {
    columns: number;
    itemWidth: number;
    itemHeight: number;
    rowHeight: number;
    sidePadding: number;
    minScroll: number;
    maxScroll: number;
}

interface VisibleItem {
    dataIndex: number;
    x: number;
    y: number;
}

const CLICK_MOVE_THRESHOLD = 6;

const createInitialGeometry = (): Geometry => ({
    columns: 1,
    itemWidth: 0,
    itemHeight: 0,
    rowHeight: 0,
    sidePadding: 0,
    minScroll: 0,
    maxScroll: 0
});

const computeColumns = (width: number): number => {
    const { desktop, tablet } = Config.list.breakpoints;
    if (width >= desktop) return 4;
    if (width >= tablet) return 2;
    return 1;
};

const computeGeometry = (width: number, height: number): Geometry => {
    const sidePadding = clamp(
        width * Config.list.sidePaddingRatio,
        Config.list.sidePaddingMin,
        Config.list.sidePaddingMax
    );

    const columns = computeColumns(width);
    const itemGap = Config.list.itemGap;

    const availableWidth = width - sidePadding * 2 - (columns - 1) * itemGap;
    const itemWidth = Math.max(0, availableWidth / columns);
    const itemHeight = clamp(
        itemWidth * Config.list.cardAspectRatio,
        Config.list.minCardHeight,
        Config.list.maxCardHeight
    );
    const rowHeight = itemHeight + itemGap;

    const totalRows = Math.ceil(Config.list.itemCount / columns);
    const totalContentHeight = totalRows * rowHeight - itemGap;
    const maxScroll = Math.max(0, totalContentHeight - height);

    return { columns, itemWidth, itemHeight, rowHeight, sidePadding, minScroll: 0, maxScroll };
};

export const ScrollableList: FC<ScrollableListProps> = ({ className }) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const layerRef = useRef<HTMLDivElement>(null);

    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [visibleItems, setVisibleItems] = useState<VisibleItem[]>([]);
    const [geometry, setGeometry] = useState<Geometry>(createInitialGeometry());

    const navigate = useNavigate();

    const viewportRef = useRef(viewport);
    const geometryRef = useRef<Geometry>(createInitialGeometry());

    const scrollYRef = useRef(0);
    const isDraggingRef = useRef(false);
    const activePointerIdRef = useRef<number | null>(null);
    const lastPointerYRef = useRef(0);
    const movedDistanceRef = useRef(0);

    const isSnappingBackRef = useRef(false);
    const snapTargetRef = useRef(0);

    const inertiaRef = useRef(
        new InertiaScroller(Config.scroll.inertiaDecayPerSecond, Config.scroll.inertiaMinVelocity)
    );
    const velocityTrackerRef = useRef(new VelocityTracker());

    const rafIdRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number | null>(null);
    const windowSignatureRef = useRef<string>('');

    const applyScrollTransform = useCallback(() => {
        if (layerRef.current) {
            layerRef.current.style.transform = `translateY(${-scrollYRef.current}px)`;
        }
    }, []);

    const updateLayout = useCallback(() => {
        const geometry = geometryRef.current;
        const { rowHeight, columns } = geometry;
        if (rowHeight <= 0 || columns <= 0) return;

        const bufferRows = Config.list.bufferRows;
        const firstVisibleRow = Math.max(0, Math.floor(scrollYRef.current / rowHeight) - bufferRows);
        const firstVisibleIndex = firstVisibleRow * columns;

        const visibleRows = Math.ceil(viewportRef.current.height / rowHeight);
        const rowsWithBuffer = visibleRows + bufferRows * 2 + 1;
        const poolSize = rowsWithBuffer * columns;

        const signature = `${firstVisibleIndex}:${poolSize}:${geometry.itemWidth}:${geometry.itemHeight}`;
        if (signature === windowSignatureRef.current) return;
        windowSignatureRef.current = signature;

        const items: VisibleItem[] = [];
        for (let poolIndex = 0; poolIndex < poolSize; poolIndex++) {
            const dataIndex = firstVisibleIndex + poolIndex;
            if (dataIndex >= Config.list.itemCount) break;

            const row = Math.floor(dataIndex / columns);
            const col = dataIndex % columns;

            items.push({
                dataIndex,
                x: geometry.sidePadding + col * (geometry.itemWidth + Config.list.itemGap),
                y: row * rowHeight
            });
        }

        setVisibleItems(items);
    }, []);

    const applyRubberBand = useCallback((value: number): number => {
        const { minScroll, maxScroll } = geometryRef.current;
        const { rubberBandResistance, rubberBandLimit } = Config.scroll;

        if (value < minScroll) {
            const overshoot = Math.min(minScroll - value, rubberBandLimit * 3);
            return minScroll - overshoot * rubberBandResistance;
        }

        if (value > maxScroll) {
            const overshoot = Math.min(value - maxScroll, rubberBandLimit * 3);
            return maxScroll + overshoot * rubberBandResistance;
        }

        return value;
    }, []);

    const beginSnapBack = useCallback(() => {
        inertiaRef.current.stop();
        isSnappingBackRef.current = true;
        const { minScroll, maxScroll } = geometryRef.current;
        snapTargetRef.current = scrollYRef.current < minScroll ? minScroll : maxScroll;
    }, []);

    const stepSnapBack = useCallback(
        (deltaMS: number) => {
            const t = 1 - Math.pow(Config.scroll.snapBackSpeed, deltaMS / 1000);
            scrollYRef.current += (snapTargetRef.current - scrollYRef.current) * t;

            if (Math.abs(snapTargetRef.current - scrollYRef.current) < 0.5) {
                scrollYRef.current = snapTargetRef.current;
                isSnappingBackRef.current = false;
            }

            applyScrollTransform();
            updateLayout();
        },
        [applyScrollTransform, updateLayout]
    );

    useEffect(() => {
        const tick = (time: number) => {
            if (lastFrameTimeRef.current === null) {
                lastFrameTimeRef.current = time;
            }
            const deltaMS = time - lastFrameTimeRef.current;
            lastFrameTimeRef.current = time;

            if (!isDraggingRef.current) {
                if (isSnappingBackRef.current) {
                    stepSnapBack(deltaMS);
                } else if (inertiaRef.current.isMoving) {
                    scrollYRef.current += inertiaRef.current.update(deltaMS);
                    const { minScroll, maxScroll } = geometryRef.current;

                    if (scrollYRef.current < minScroll || scrollYRef.current > maxScroll) {
                        beginSnapBack();
                    }

                    applyScrollTransform();
                    updateLayout();
                }
            }

            rafIdRef.current = requestAnimationFrame(tick);
        };

        rafIdRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        };
    }, [applyScrollTransform, beginSnapBack, stepSnapBack, updateLayout]);

    useEffect(() => {
        const node = rootRef.current;
        if (!node) return;

        const handleResize = (width: number, height: number) => {
            viewportRef.current = { width, height };
            const nextGeometry = computeGeometry(width, height);
            geometryRef.current = nextGeometry;

            const { minScroll, maxScroll } = nextGeometry;
            scrollYRef.current = clamp(scrollYRef.current, minScroll, maxScroll);

            applyScrollTransform();
            windowSignatureRef.current = '';
            updateLayout();
            setViewport({ width, height });
            setGeometry(nextGeometry); // ← new
        };

        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            handleResize(width, height);
        });

        observer.observe(node);
        return () => observer.disconnect();
    }, [applyScrollTransform, updateLayout]);

    useEffect(() => {
        const node = rootRef.current;
        if (!node) return;

        const onWheel = (event: WheelEvent) => {
            event.preventDefault();

            isSnappingBackRef.current = false;
            inertiaRef.current.stop();

            let delta = event.deltaY;
            if (event.deltaMode === 1) delta *= 18;
            else if (event.deltaMode === 2) delta *= viewportRef.current.height;

            const { minScroll, maxScroll } = geometryRef.current;
            scrollYRef.current = clamp(scrollYRef.current + delta, minScroll, maxScroll);

            applyScrollTransform();
            updateLayout();
        };

        node.addEventListener('wheel', onWheel, { passive: false });
        return () => node.removeEventListener('wheel', onWheel);
    }, [applyScrollTransform, updateLayout]);

    useEffect(() => {
        const onPointerMove = (event: PointerEvent) => {
            if (!isDraggingRef.current || event.pointerId !== activePointerIdRef.current) return;

            const currentY = event.clientY;
            const deltaY = currentY - lastPointerYRef.current;
            lastPointerYRef.current = currentY;
            movedDistanceRef.current += Math.abs(deltaY);
            velocityTrackerRef.current.addSample(currentY);

            const proposedScrollY = scrollYRef.current - deltaY;
            scrollYRef.current = applyRubberBand(proposedScrollY);

            applyScrollTransform();
            updateLayout();
        };

        const onPointerUp = (event: PointerEvent) => {
            if (event.pointerId !== activePointerIdRef.current) return;

            activePointerIdRef.current = null;
            isDraggingRef.current = false;

            const pointerVelocity = clamp(
                velocityTrackerRef.current.getVelocity(),
                -Config.scroll.maxFlingVelocity,
                Config.scroll.maxFlingVelocity
            );
            inertiaRef.current.setVelocity(-pointerVelocity);

            const { minScroll, maxScroll } = geometryRef.current;
            if (scrollYRef.current < minScroll || scrollYRef.current > maxScroll) {
                beginSnapBack();
            }
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };
    }, [applyRubberBand, applyScrollTransform, beginSnapBack, updateLayout]);

    const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
        if (activePointerIdRef.current !== null) return;

        activePointerIdRef.current = event.pointerId;
        isDraggingRef.current = true;
        isSnappingBackRef.current = false;
        movedDistanceRef.current = 0;
        inertiaRef.current.stop();

        lastPointerYRef.current = event.clientY;
        velocityTrackerRef.current.reset();
        velocityTrackerRef.current.addSample(event.clientY);
    }, []);

    const handleClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (movedDistanceRef.current > CLICK_MOVE_THRESHOLD) {
            event.stopPropagation();
        }
    }, []);

    const handleItemClick = () => {
        navigate(`/game/${gamesConfig[0].id}`);
    };

    return (
        <Root
            ref={rootRef}
            className={className}
            onPointerDown={handlePointerDown}
            onClickCapture={handleClickCapture}
        >
            <ItemsLayer ref={layerRef}>
                {viewport.width > 0 &&
                    visibleItems.map((item) => (
                        <ItemSlot
                            key={item.dataIndex}
                            style={{ transform: `translate(${item.x}px, ${item.y}px)` }}
                        >
                            <ListItem
                                width={geometry.itemWidth}
                                height={geometry.itemHeight}
                                index={item.dataIndex}
                                onClick={handleItemClick}
                            />
                        </ItemSlot>
                    ))}
            </ItemsLayer>
        </Root>
    );
};

const Root = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    touch-action: none;
    cursor: grab;
    user-select: none;

    &:active {
        cursor: grabbing;
    }
`;

const ItemsLayer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    will-change: transform;
`;

const ItemSlot = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform;
`;
