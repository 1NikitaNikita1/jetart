import type { FC } from 'react';
import { memo } from 'react';
import styled from 'styled-components';

export interface ListItemProps {
    width: number;
    height: number;
    index: number;
    onClick?: (index: number) => void;
}

const MIN_FONT_SIZE = 15;
const MAX_FONT_SIZE = 22;

const computeFontSize = (height: number): number =>
    Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, height * 0.22));

export const ListItem: FC<ListItemProps> = memo(({ width, height, index, onClick }) => {
    const fontSize = computeFontSize(height);

    return (
        <Card $width={width} $height={height} onClick={onClick ? () => onClick(index) : undefined}>
            <Label $fontSize={fontSize}>{`Game №${index + 1}`}</Label>
        </Card>
    );
});

ListItem.displayName = 'ListItem';

const Label = styled.span<{ $fontSize: number }>`
    color: #fff3;
    font-weight: 600;
    font-size: 16px;
    white-space: nowrap;
    pointer-events: none;
    transition: 0.15s ease;
`;

const Card = styled.div<{ $width: number; $height: number }>`
    position: relative;
    flex-shrink: 0;
    box-sizing: border-box;
    width: ${({ $width }) => $width}px;
    height: ${({ $height }) => $height}px;
    border-radius: 14px;
    background-color: #fff1;
    overflow: hidden;
    cursor: pointer;
    transition: background-color 0.15s ease;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    &:hover {
        filter: brightness(1.05);
        background-color: #fff2;
        ${Label} {
            color: #fff7;
        }
    }

    &:active {
        transform: scale(0.98);
    }
`;
