import React, { useEffect, useState } from 'react';
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
        <img src={image.src} alt={image.alt} />
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
                            {card.image && <img src={card.image.src} alt={card.image.alt} />}
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
                        <h1 id="mainTitle">PLAYER'S MANUAL</h1>

                        <nav>{renderNav(manualNav)}</nav>

                        <div className="bookArea">
                            <div className={`book ${isCover ? 'cover' : ''}`}>
                                <article
                                    key={pageIndex}
                                    className={`bookPage ${direction === 'next' ? 'turnNext' : direction === 'prev' ? 'turnPrev' : ''}`}
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

                            <div className="bookControls">
                                <button
                                    className="bookBtn"
                                    onClick={() => goToIndex(pageIndex - 1)}
                                    disabled={pageIndex === 0}
                                    aria-label="Previous page"
                                >
                                    PREVIOUS
                                </button>

                                <div className="pageIndicator">
                                    <span>PAGE {pageIndex + 1} / {totalPages}</span>
                                    <div className="pageProgress">
                                        <span style={{ width: `${((pageIndex + 1) / totalPages) * 100}%` }} />
                                    </div>
                                </div>

                                <button
                                    className="bookBtn"
                                    onClick={() => goToIndex(pageIndex + 1)}
                                    disabled={pageIndex === lastIndex}
                                    aria-label="Next page"
                                >
                                    NEXT
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Manual;