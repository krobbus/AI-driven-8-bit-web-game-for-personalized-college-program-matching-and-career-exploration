import React, { useEffect, useRef, useState } from 'react';
import type { ModalProps } from '../types/props';
import {
    manualNav,
    manualPages,
    type ManualBlock,
    type ManualImage,
    type ManualNavItem,
} from '../pages/data/manualLib';
import '../../styles/Modal.css';
import '../../styles/Manual.css';

type Direction = 'next' | 'prev' | 'none';

const totalPages = manualPages.length;
const lastIndex = totalPages - 1;

const pageIndexByNavId = new Map<string, number>();
manualPages.forEach((page, index) => {
    page.navIds.forEach(id => pageIndexByNavId.set(id, index));
});

const Figure: React.FC<{ image: ManualImage }> = ({ image }) => (
    <figure className="figure">
        <img src={image.src} alt={image.alt} draggable={false} />
        {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>
);

const renderBlock = (block: ManualBlock, key: number) => {
    switch (block.type) {
        case 'text':
            return (
                <div key={key} className="textBlock">
                    {block.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                </div>
            );

        case 'image':
            return <Figure key={key} image={block.image} />;

        case 'images':
            return (
                <div key={key} className="figureGroup">
                    {block.images.map(image => <Figure key={image.src} image={image} />)}
                </div>
            );

        case 'list':
            return (
                <ul key={key} className="checkList">
                    {block.items.map(item => <li key={item}>{item}</li>)}
                </ul>
            );

        case 'cards':
            return (
                <div key={key} className={`cardGrid ${block.columns === 1 ? 'single' : ''}`}>
                    {block.cards.map((card, i) => (
                        <div key={i} className="manualCard">
                            {card.image && <img src={card.image.src} alt={card.image.alt} draggable={false} />}
                            {card.title && <h3 className="cardTitle">{card.title}</h3>}
                            {card.text?.map((paragraph, j) => <p key={j}>{paragraph}</p>)}
                        </div>
                    ))}
                </div>
            );
    }
};

const Manual: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const [pageIndex, setPageIndex] = useState(0);
    const [direction, setDirection] = useState<Direction>('none');
    const [dragOffset, setDragOffset] = useState(0);
    const pointerStart = useRef<{ id: number; x: number; y: number; horizontal: boolean } | null>(null);

    const goToIndex = (target: number) => {
        const next = Math.min(Math.max(target, 0), lastIndex);
        if (next === pageIndex) return;

        setDirection(next > pageIndex ? 'next' : 'prev');
        setPageIndex(next);
    };

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();

        const target = pageIndexByNavId.get(id);
        if (target !== undefined) goToIndex(target);
    };

    const handlePagePointerDown = (e: React.PointerEvent<HTMLElement>) => {
        if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
        if ((e.target as HTMLElement).closest('button, a, input, textarea, select')) return;

        pointerStart.current = { id: e.pointerId, x: e.clientX, y: e.clientY, horizontal: false };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePagePointerMove = (e: React.PointerEvent<HTMLElement>) => {
        const start = pointerStart.current;
        if (!start || start.id !== e.pointerId) return;

        const deltaX = e.clientX - start.x;
        const deltaY = e.clientY - start.y;
        if (!start.horizontal && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
            start.horizontal = true;
        }

        if (start.horizontal) {
            e.preventDefault();
            setDragOffset(deltaX);
        }
    };

    const finishPagePointer = (e: React.PointerEvent<HTMLElement>, turnPage: boolean) => {
        const start = pointerStart.current;
        if (!start || start.id !== e.pointerId) return;

        const deltaX = e.clientX - start.x;
        const shouldTurn = turnPage && start.horizontal
            && Math.abs(deltaX) > e.currentTarget.clientWidth * 0.18;
        pointerStart.current = null;
        setDragOffset(0);

        if (shouldTurn) goToIndex(pageIndex + (deltaX < 0 ? 1 : -1));
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    useEffect(() => {
        if (window.game?.input?.keyboard){
            isOpen ? window.game.input.keyboard.stopListeners() : window.game.input.keyboard.startListeners();
        }
        return () => window.game?.input?.keyboard?.startListeners();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setPageIndex(0);
            setDirection('none');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goToIndex(pageIndex + 1);
            if (e.key === 'ArrowLeft') goToIndex(pageIndex - 1);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, pageIndex]);

    const page = manualPages[pageIndex];
    if (!isOpen || !page) return null;

    const isCover = page.variant === 'cover';
    const activeNavId = page.navIds[page.navIds.length - 1];

    const renderNav = (items: ManualNavItem[]) => (
        <ul>
            {items.map(item => (
                <li key={item.target}>
                    <a
                        href={`#${item.target}`}
                        aria-current={item.target === activeNavId ? 'page' : undefined}
                        onClick={(e) => handleNavClick(e, item.target)}
                    >
                        {item.label}
                    </a>

                    {item.children && renderNav(item.children)}
                </li>
            ))}
        </ul>
    );

    return(
        <div className="modalBackdrop">
            <div className="modalContainer">
                <div className="modalContent">
                    <button id="closeButton" onClick={onClose}>X</button>

                    <section id="manualContainer" className="manualContainer">
                        <div className="manualTitleBar">
                            <h1 id="mainTitle">PLAYER'S MANUAL</h1>
                            <div className="pageIndicator">
                                <span>PAGE {pageIndex + 1} / {totalPages}</span>
                                <div
                                    className="pageProgress"
                                    role="progressbar"
                                    aria-label="Manual reading progress"
                                    aria-valuemin={1}
                                    aria-valuemax={totalPages}
                                    aria-valuenow={pageIndex + 1}
                                >
                                    <span style={{ width: `${((pageIndex + 1) / totalPages) * 100}%` }} />
                                </div>
                            </div>
                        </div>

                        <nav>{renderNav(manualNav)}</nav>

                        <div className="bookArea">
                            <div className={`book ${isCover ? 'cover' : ''}`}>
                                <article
                                    key={pageIndex}
                                    className={`bookPage ${direction === 'next' ? 'turnNext' : direction === 'prev' ? 'turnPrev' : ''} ${dragOffset !== 0 ? 'dragging' : ''}`}
                                    style={{
                                        transform: dragOffset !== 0
                                            ? `translateX(${dragOffset}px) rotateY(${Math.max(-12, Math.min(12, dragOffset / 12))}deg)`
                                            : undefined,
                                        transition: dragOffset === 0 ? 'transform 240ms ease-out' : 'none',
                                    }}
                                    onPointerDown={handlePagePointerDown}
                                    onPointerMove={handlePagePointerMove}
                                    onPointerUp={(e) => finishPagePointer(e, true)}
                                    onPointerCancel={(e) => finishPagePointer(e, false)}
                                >
                                    <header className="pageHeader">
                                        {page.chapter && <span className="chapterTab">{page.chapter}</span>}
                                        <h2 className="pageTitle">{page.title}</h2>
                                        {page.lead && <p className="pageLead">{page.lead}</p>}
                                    </header>

                                    <div className="pageBody">
                                        {page.blocks.map(renderBlock)}
                                    </div>

                                    {isCover && (
                                        <button className="bookBtn" onClick={() => goToIndex(1)}>START READING</button>
                                    )}
                                </article>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Manual;