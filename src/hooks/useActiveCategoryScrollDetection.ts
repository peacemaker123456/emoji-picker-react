import { useEffect } from 'react';

import { categoryNameFromDom } from '../DomUtils/categoryNameFromDom';
import { asSelectors, ClassNames } from '../DomUtils/classNames';
import { useBodyRef } from '../components/context/ElementRefContext';

export function useActiveCategoryScrollDetection({
  setActiveCategory,
  setVisibleCategories
}: {
  setActiveCategory: (category: string) => void;
  setVisibleCategories: (categories: string[]) => void;
}) {
  const BodyRef = useBodyRef();

  useEffect(() => {
    const visibleCategories = new Map<string, number>();
    const intersectingCategories = new Map<string, boolean>();
    const bodyRef = BodyRef.current;
    const observer = new IntersectionObserver(
      entries => {
        if (!bodyRef) {
          return;
        }

        console.log('📥 Entries in this callback:',
          entries.map(e => ({
            id: categoryNameFromDom(e.target),
            ratio: e.intersectionRatio,
            isIntersecting: e.isIntersecting
          }))
        );

        for (const entry of entries) {
          const id = categoryNameFromDom(entry.target);

          if (!id) {
            continue;
          }

          visibleCategories.set(id, entry.intersectionRatio);
          intersectingCategories.set(id, entry.isIntersecting);
        }

        const ratios = Array.from(visibleCategories);
        const visibleCats = ratios
          .filter(([id, ratio]) => ratio > 0 || intersectingCategories.get(id))
          .map(([id]) => id);

        console.log('🔍 Intersection update:', {
          allRatios: Object.fromEntries(ratios),
          visibleCategories: visibleCats,
          entriesCount: entries.length
        });

        setVisibleCategories(visibleCats);
        const lastCategory = ratios[ratios.length - 1];

        if (lastCategory && lastCategory[1] == 1) {
          return setActiveCategory(lastCategory[0]);
        }

        for (const [id, ratio] of ratios) {
          if (ratio) {
            setActiveCategory(id);
            break;
          }
        }
      },
      {
        root: bodyRef,
        threshold: [0, 1]
      }
    );
    const elements = bodyRef?.querySelectorAll(asSelectors(ClassNames.category));
    console.log('🎯 Setting up observer for categories:',
      Array.from(elements || []).map(el => categoryNameFromDom(el))
    );

    elements?.forEach(el => {
      observer.observe(el);
    });

    return () => {
      console.log('🧹 Disconnecting observer');
      observer.disconnect();
    };
  }, [BodyRef, setActiveCategory, setVisibleCategories]);
}
