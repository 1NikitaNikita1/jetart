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

type ScrollDirection = 'vertical' | 'horizontal';

interface Geometry {
    direction: ScrollDirection;
    columns: number;
    itemWidth: number;
    itemHeight: number;
    itemStep: number;
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
    direction: 'vertical',
    columns: 1,
    itemWidth: 0,
    itemHeight: 0,
    itemStep: 0,
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

const isHorizontalMobile = (width: number, height: number): boolean => {
    return width < Config.list.breakpoints.desktop && width > height;
};

const computeGeometry = (width: number, height: number): Geometry => {
    const sidePadding = clamp(
        width * Config.list.sidePaddingRatio,
        Config.list.sidePaddingMin,
        Config.list.sidePaddingMax
    );

    const direction: ScrollDirection = isHorizontalMobile(width, height) ? 'horizontal' : 'vertical';

    const itemGap = Config.list.itemGap;

    if (direction === 'horizontal') {
        const availableHeight = Math.max(0, height - Config.list.sidePaddingMin * 2);

        const itemHeight = clamp(availableHeight, Config.list.minCardHeight, Config.list.maxCardHeight);

        const itemWidth = itemHeight / Config.list.cardAspectRatio;
        const itemStep = itemWidth + itemGap;

        const totalContentWidth = sidePadding * 2 + Config.list.itemCount * itemStep - itemGap;

        return {
            direction,
            columns: 1,
            itemWidth,
            itemHeight,
            itemStep,
            sidePadding,
            minScroll: 0,
            maxScroll: Math.max(0, totalContentWidth - width)
        };
    }

    const columns = computeColumns(width);

    const availableWidth = width - sidePadding * 2 - (columns - 1) * itemGap;

    const itemWidth = Math.max(0, availableWidth / columns);

    const itemHeight = clamp(
        itemWidth * Config.list.cardAspectRatio,
        Config.list.minCardHeight,
        Config.list.maxCardHeight
    );

    const itemStep = itemHeight + itemGap;

    const totalRows = Math.ceil(Config.list.itemCount / columns);

    const totalContentHeight = totalRows * itemStep - itemGap;

    const maxScroll = Math.max(0, totalContentHeight - height);

    return {
        direction,
        columns,
        itemWidth,
        itemHeight,
        itemStep,
        sidePadding,
        minScroll: 0,
        maxScroll
    };
};

export const ScrollableList: FC<ScrollableListProps> = ({ className }) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const layerRef = useRef<HTMLDivElement>(null);

    const [viewport, setViewport] = useState({
        width: 0,
        height: 0
    });

    const [visibleItems, setVisibleItems] = useState<VisibleItem[]>([]);
    const [geometry, setGeometry] = useState<Geometry>(createInitialGeometry());

    const navigate = useNavigate();

    const viewportRef = useRef(viewport);
    const geometryRef = useRef<Geometry>(createInitialGeometry());

    const scrollRef = useRef(0);

    const isDraggingRef = useRef(false);
    const activePointerIdRef = useRef<number | null>(null);
    const lastPointerPositionRef = useRef(0);
    const movedDistanceRef = useRef(0);

    const isSnappingBackRef = useRef(false);
    const snapTargetRef = useRef(0);

    const inertiaRef = useRef(
        new InertiaScroller(Config.scroll.inertiaDecayPerSecond, Config.scroll.inertiaMinVelocity)
    );

    const velocityTrackerRef = useRef(new VelocityTracker());

    const rafIdRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number | null>(null);
    const windowSignatureRef = useRef('');

    const getPointerPosition = useCallback((event: PointerEvent | ReactPointerEvent<HTMLDivElement>): number => {
        return geometryRef.current.direction === 'horizontal' ? event.clientX : event.clientY;
    }, []);

    const applyScrollTransform = useCallback(() => {
        if (!layerRef.current) return;

        const { direction } = geometryRef.current;

        layerRef.current.style.transform =
            direction === 'horizontal'
                ? `translateX(${-scrollRef.current}px)`
                : `translateY(${-scrollRef.current}px)`;
    }, []);

    const updateLayout = useCallback(() => {
        const currentGeometry = geometryRef.current;
        const { direction, itemStep, columns } = currentGeometry;

        if (itemStep <= 0 || columns <= 0) return;

        const bufferRows = Config.list.bufferRows;

        if (direction === 'horizontal') {
            const firstVisibleIndex = Math.max(0, Math.floor(scrollRef.current / itemStep) - bufferRows);

            const visibleCount = Math.ceil(viewportRef.current.width / itemStep) + bufferRows * 2 + 1;

            const signature = [
                direction,
                firstVisibleIndex,
                visibleCount,
                currentGeometry.itemWidth,
                currentGeometry.itemHeight,
                currentGeometry.sidePadding
            ].join(':');

            if (signature === windowSignatureRef.current) return;

            windowSignatureRef.current = signature;

            const items: VisibleItem[] = [];

            const y = Math.max(0, (viewportRef.current.height - currentGeometry.itemHeight) / 2);

            for (let index = 0; index < visibleCount; index++) {
                const dataIndex = firstVisibleIndex + index;

                if (dataIndex >= Config.list.itemCount) break;

                items.push({
                    dataIndex,
                    x: currentGeometry.sidePadding + dataIndex * itemStep,
                    y
                });
            }

            setVisibleItems(items);
            return;
        }

        const firstVisibleRow = Math.max(0, Math.floor(scrollRef.current / itemStep) - bufferRows);

        const firstVisibleIndex = firstVisibleRow * columns;

        const visibleRows = Math.ceil(viewportRef.current.height / itemStep);

        const rowsWithBuffer = visibleRows + bufferRows * 2 + 1;

        const poolSize = rowsWithBuffer * columns;

        const signature = [
            direction,
            firstVisibleIndex,
            poolSize,
            currentGeometry.itemWidth,
            currentGeometry.itemHeight,
            currentGeometry.sidePadding,
            columns
        ].join(':');

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
                x: currentGeometry.sidePadding + col * (currentGeometry.itemWidth + Config.list.itemGap),
                y: row * itemStep
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

        snapTargetRef.current = scrollRef.current < minScroll ? minScroll : maxScroll;
    }, []);

    const stepSnapBack = useCallback(
        (deltaMS: number) => {
            const t = 1 - Math.pow(Config.scroll.snapBackSpeed, deltaMS / 1000);

            scrollRef.current += (snapTargetRef.current - scrollRef.current) * t;

            if (Math.abs(snapTargetRef.current - scrollRef.current) < 0.5) {
                scrollRef.current = snapTargetRef.current;

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
                    scrollRef.current += inertiaRef.current.update(deltaMS);

                    const { minScroll, maxScroll } = geometryRef.current;

                    if (scrollRef.current < minScroll || scrollRef.current > maxScroll) {
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
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, [applyScrollTransform, beginSnapBack, stepSnapBack, updateLayout]);

    useEffect(() => {
        const node = rootRef.current;

        if (!node) return;

        const handleResize = (width: number, height: number) => {
            const previousGeometry = geometryRef.current;

            const progress =
                previousGeometry.maxScroll > 0 ? clamp(scrollRef.current / previousGeometry.maxScroll, 0, 1) : 0;

            const nextGeometry = computeGeometry(width, height);

            viewportRef.current = {
                width,
                height
            };

            geometryRef.current = nextGeometry;

            scrollRef.current = clamp(
                progress * nextGeometry.maxScroll,
                nextGeometry.minScroll,
                nextGeometry.maxScroll
            );

            inertiaRef.current.stop();
            isSnappingBackRef.current = false;

            applyScrollTransform();

            windowSignatureRef.current = '';

            updateLayout();

            setViewport({
                width,
                height
            });

            setGeometry(nextGeometry);
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

            const { direction } = geometryRef.current;

            let delta = direction === 'horizontal' ? event.deltaX || event.deltaY : event.deltaY;

            if (event.deltaMode === 1) {
                delta *= 18;
            } else if (event.deltaMode === 2) {
                delta *= direction === 'horizontal' ? viewportRef.current.width : viewportRef.current.height;
            }

            const { minScroll, maxScroll } = geometryRef.current;

            scrollRef.current = clamp(scrollRef.current + delta, minScroll, maxScroll);

            applyScrollTransform();
            updateLayout();
        };

        node.addEventListener('wheel', onWheel, {
            passive: false
        });

        return () => {
            node.removeEventListener('wheel', onWheel);
        };
    }, [applyScrollTransform, updateLayout]);

    useEffect(() => {
        const onPointerMove = (event: PointerEvent) => {
            if (!isDraggingRef.current || event.pointerId !== activePointerIdRef.current) {
                return;
            }

            const currentPosition = getPointerPosition(event);

            const delta = currentPosition - lastPointerPositionRef.current;

            lastPointerPositionRef.current = currentPosition;

            movedDistanceRef.current += Math.abs(delta);

            velocityTrackerRef.current.addSample(currentPosition);

            const proposedScroll = scrollRef.current - delta;

            scrollRef.current = applyRubberBand(proposedScroll);

            applyScrollTransform();
            updateLayout();
        };

        const onPointerUp = (event: PointerEvent) => {
            if (event.pointerId !== activePointerIdRef.current) {
                return;
            }

            activePointerIdRef.current = null;
            isDraggingRef.current = false;

            const pointerVelocity = clamp(
                velocityTrackerRef.current.getVelocity(),
                -Config.scroll.maxFlingVelocity,
                Config.scroll.maxFlingVelocity
            );

            inertiaRef.current.setVelocity(-pointerVelocity);

            const { minScroll, maxScroll } = geometryRef.current;

            if (scrollRef.current < minScroll || scrollRef.current > maxScroll) {
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
    }, [applyRubberBand, applyScrollTransform, beginSnapBack, getPointerPosition, updateLayout]);

    const handlePointerDown = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (activePointerIdRef.current !== null) {
                return;
            }

            activePointerIdRef.current = event.pointerId;

            isDraggingRef.current = true;
            isSnappingBackRef.current = false;

            movedDistanceRef.current = 0;

            inertiaRef.current.stop();

            const position = getPointerPosition(event);

            lastPointerPositionRef.current = position;

            velocityTrackerRef.current.reset();

            velocityTrackerRef.current.addSample(position);
        },
        [getPointerPosition]
    );

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
                            style={{
                                transform: `translate(${item.x}px, ${item.y}px)`
                            }}
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
    height: 100%;
    will-change: transform;
`;

const ItemSlot = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform;
`;
