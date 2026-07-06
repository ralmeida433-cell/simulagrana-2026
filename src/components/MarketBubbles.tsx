import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_MODULES } from './shared/AssetHoverMenu';
import { cn } from '../lib/utils';

interface HeatmapItem {
  ticker: string;
  change: number;
  marketCap: number;
}

interface MarketBubblesProps {
  data: HeatmapItem[];
}

interface BubbleNode extends d3.SimulationNodeDatum {
  id: string;
  ticker: string;
  change: number;
  marketCap: number;
  radius: number;
  color: string;
  strokeColor: string;
}

export default function MarketBubbles({ data }: MarketBubblesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const simulationRef = useRef<d3.Simulation<BubbleNode, undefined> | null>(null);
  
  // Quick Menu state
  const [activeMenu, setActiveMenu] = useState<{
    ticker: string;
    type: 'acao' | 'fii';
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Close menu if clicking outside
      if (activeMenu && !(e.target as HTMLElement).closest('.quick-action-menu')) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [activeMenu]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    // Clear previous SVG and tooltips
    d3.select(containerRef.current).selectAll('svg').remove();
    d3.select(containerRef.current).selectAll('.bubble-tooltip').remove();
    
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    if (!data || data.length === 0) return;

    const width = dimensions.width;
    const height = dimensions.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const maxChange = d3.max(data, d => Math.abs(d.change)) || 1;
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxChange])
      .range([15, Math.min(width, height) / 4.5]);

    const nodes: BubbleNode[] = data.map(d => {
      const change = d.change;
      let color = '#94a3b8'; // slate-400
      let strokeColor = '#64748b'; // slate-500
      
      if (change > 2) { color = '#059669'; strokeColor = '#047857'; }
      else if (change > 0) { color = '#34d399'; strokeColor = '#047857'; }
      else if (change < -2) { color = '#dc2626'; strokeColor = '#b91c1c'; }
      else if (change < 0) { color = '#f87171'; strokeColor = '#b91c1c'; }

      return {
        id: d.ticker,
        ticker: d.ticker,
        change: d.change,
        marketCap: d.marketCap,
        radius: radiusScale(Math.abs(d.change) || 0.1),
        color,
        strokeColor,
        x: centerX + (Math.random() - 0.5) * width * 0.4,
        y: centerY + (Math.random() - 0.5) * height * 0.4,
      };
    });

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'width: 100%; height: 100%; display: block; overflow: hidden; cursor: grab;')
      .call(d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        })
      )
      .on('mousedown', () => svg.style('cursor', 'grabbing'))
      .on('mouseup', () => svg.style('cursor', 'grab'));

    const g = svg.append('g');

    // Tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'bubble-tooltip absolute hidden bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl pointer-events-none z-50 border border-slate-700')
      .style('transform', 'translate(-50%, -100%)')
      .style('margin-top', '-10px');

    const node = g.selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, BubbleNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('mouseover', function(event, d) {
        if (activeMenu) return;

        d3.select(this).select('circle')
          .attr('stroke-width', 4)
          .attr('fill-opacity', 1);
        
        tooltip
          .classed('hidden', false)
          .html(`
            <div class="font-bold text-sm mb-1">${d.ticker}</div>
            <div class="flex flex-col gap-1">
              <div class="flex justify-between gap-4">
                <span class="text-slate-400">Variação:</span>
                <span class="${d.change >= 0 ? 'text-emerald-400' : 'text-red-400'} font-bold">
                  ${d.change > 0 ? '+' : ''}${d.change.toFixed(2)}%
                </span>
              </div>
              <div class="text-[9px] text-slate-500 italic mt-1">Clique para abrir menu de ações</div>
            </div>
          `)
          .style('left', (event.pageX) + 'px')
          .style('top', (event.pageY) + 'px');
      })
      .on('mousemove', function(event) {
        if (activeMenu) return;
        tooltip
          .style('left', (event.pageX) + 'px')
          .style('top', (event.pageY) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).select('circle')
          .attr('stroke-width', 1)
          .attr('fill-opacity', 0.85);
        tooltip.classed('hidden', true);
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        
        // Hide tooltip
        tooltip.classed('hidden', true);

        // Detect type
        const cleanTicker = d.ticker.trim().toUpperCase();
        const type = cleanTicker.includes('11') ? 'fii' : 'acao';

        setActiveMenu({
          ticker: d.ticker,
          type: type as 'acao' | 'fii',
          x: event.pageX,
          y: event.pageY
        });
      });

    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.85)
      .attr('stroke', d => d.strokeColor)
      .attr('stroke-width', 1)
      .style('transition', 'fill-opacity 0.2s, stroke-width 0.2s');

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('fill', 'white')
      .style('font-size', d => Math.min(d.radius / 2.5, 18) + 'px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => d.radius > 15 ? d.ticker.replace('3', '').replace('4', '') : '');

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('fill', 'white')
      .style('font-size', d => Math.min(d.radius / 4.5, 12) + 'px')
      .style('pointer-events', 'none')
      .style('opacity', 0.9)
      .text(d => d.radius > 25 ? `${d.change > 0 ? '+' : ''}${d.change.toFixed(1)}%` : '');

    const simulation = d3.forceSimulation<BubbleNode>(nodes)
      .force('x', d3.forceX(centerX).strength(0.08))
      .force('y', d3.forceY(centerY).strength(0.08))
      .force('collide', d3.forceCollide<BubbleNode>().radius(d => d.radius + 3).iterations(4).strength(0.9))
      .force('charge', d3.forceManyBody().strength(10))
      .on('tick', () => {
        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });

    simulationRef.current = simulation;

    const interval = setInterval(() => {
      simulation.alpha(0.1).restart();
    }, 5000);

    function dragstarted(event: any, d: BubbleNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(this).select('circle').attr('stroke-width', 4);
    }

    function dragged(event: any, d: BubbleNode) {
      d.fx = event.x;
      d.fy = event.y;
      if (!activeMenu) {
        tooltip.style('left', (event.sourceEvent.pageX) + 'px')
               .style('top', (event.sourceEvent.pageY) + 'px');
      }
    }

    function dragended(event: any, d: BubbleNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      if (!activeMenu) {
        d3.select(this).select('circle').attr('stroke-width', 1);
      }
    }

    return () => {
      clearInterval(interval);
      simulation.stop();
      d3.select(containerRef.current).selectAll('.bubble-tooltip').remove();
    };
  }, [data, dimensions, activeMenu]);

  const handleNavigate = (tabId: string, ticker: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    const cleanTicker = ticker.trim().split('.')[0].toUpperCase();
    url.searchParams.set('ticker', cleanTicker);
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new Event('popstate'));
    setActiveMenu(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[350px] relative overflow-hidden bg-background/50 rounded-2xl border border-border/50">
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {activeMenu && (
            <motion.div
              drag
              dragMomentum={false}
              dragElastic={0.1}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="quick-action-menu fixed z-[9999] w-64 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden touch-none"
              style={{
                top: Math.min(window.innerHeight - 350, Math.max(80, activeMenu.y - 150)),
                left: Math.min(window.innerWidth - 270, Math.max(10, activeMenu.x - 128)),
              }}
            >
              <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between cursor-move active:bg-primary/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shrink-0 flex items-center justify-center p-1 border border-border">
                    <img 
                      src={`https://icons.brapi.dev/icons/${activeMenu.ticker.toUpperCase()}.svg`}
                      alt={activeMenu.ticker}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://s3-symbol-logo.tradingview.com/${activeMenu.ticker.replace('.SA', '').toLowerCase()}--big.svg`;
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-foreground leading-none">{activeMenu.ticker.split('.')[0]}</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">{activeMenu.type === 'acao' ? 'Ação' : 'FII'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col py-1">
                {ALL_MODULES.filter(mod => mod.types.includes(activeMenu.type)).map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleNavigate(option.id, activeMenu.ticker)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-primary/10 hover:text-primary transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
