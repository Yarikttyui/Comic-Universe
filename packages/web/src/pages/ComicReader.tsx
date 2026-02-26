import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useComicsStore } from '../store/comicsStore';
import { progressApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Tag } from '../components/ui/Tag';

export default function ComicReader() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const { currentComic, pages, currentPage, isLoading, fetchPages, setCurrentPage, makeChoice } = useComicsStore();

  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    fetchPages(id);
    if (isAuthenticated) {
      progressApi.start(id).catch(() => undefined);
    }
  }, [fetchPages, id, isAuthenticated]);

  useEffect(() => {
    if (!id || !currentPage?.isEnding || !isAuthenticated) return;

    progressApi
      .recordEnding(id, {
        endingPageId: currentPage.pageId,
        endingType: currentPage.endingType || 'normal',
      })
      .catch(() => undefined);
  }, [currentPage?.endingType, currentPage?.isEnding, currentPage?.pageId, id, isAuthenticated]);

  const currentIndex = useMemo(() => {
    if (!currentPage) return -1;
    return pages.findIndex((item) => item.pageId === currentPage.pageId);
  }, [currentPage, pages]);

  if (isLoading) {
    return (
      <section className="page">
        <div className="container notice">Загрузка комикса...</div>
      </section>
    );
  }

  if (!currentComic || !currentPage) {
    return (
      <section className="page">
        <div className="container"><EmptyState title="Не удалось открыть комикс" /></div>
      </section>
    );
  }

  const goBack = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setCurrentPage(prev);
    setHistory((prevHistory) => prevHistory.slice(0, -1));
  };

  const restart = () => {
    setCurrentPage(currentComic.startPageId);
    setHistory([]);
  };

  return (
    <section className="page">
      <div className="container stack">
        <div className="row-between">
          <Link to={`/comic/${id}`} className="btn btn-ghost btn-md">К описанию</Link>
          <div className="cluster">
            <Button variant="ghost" onClick={goBack} disabled={history.length === 0}>Назад по выбору</Button>
            <Button variant="outline" onClick={restart}>Сначала</Button>
          </div>
        </div>

        <Card>
          <div className="stack">
            <div className="row-between">
              <strong>{currentComic.title}</strong>
              <Tag tone="soft">{currentIndex + 1} / {pages.length}</Tag>
            </div>

            {currentPage.title ? <h2 style={{ fontSize: '1.12rem' }}>{currentPage.title}</h2> : null}

            <div className="stack">
              {currentPage.panels?.map((panel: any, panelIndex: number) => (
                <div key={panel.id || panelIndex} className="panel-item stack">
                  {panel.imageUrl ? <img src={panel.imageUrl} alt="панель" style={{ borderRadius: 8 }} /> : null}
                  {(panel.dialogues || []).map((dialogue: any, dialogueIndex: number) => (
                    <div className="card" style={{ padding: '0.5rem 0.65rem' }} key={dialogue.id || dialogueIndex}>
                      {dialogue.character ? <strong>{dialogue.character}: </strong> : null}
                      <span>{dialogue.text}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {currentPage.isEnding ? (
              <div className="notice">
                Финал: {currentPage.endingTitle || 'Концовка'}
                <div className="cluster" style={{ marginTop: '0.7rem' }}>
                  <Button onClick={restart}>Пройти ещё раз</Button>
                  <Link className="btn btn-outline btn-md" to="/library">В библиотеку</Link>
                </div>
              </div>
            ) : (
              <div className="stack">
                <strong>Выбор</strong>
                <div className="stack">
                  {(currentPage.choices || []).map((choice: any, index: number) => (
                    <button
                      key={choice.id || choice.choiceId || index}
                      className="btn btn-outline btn-md"
                      type="button"
                      onClick={() => {
                        setHistory((prevHistory) => [...prevHistory, currentPage.pageId]);
                        makeChoice(choice.choiceId || choice.id || String(index), choice.targetPageId);
                      }}
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
