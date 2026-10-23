import { useState } from 'react'

const IMG = {
  site: 'https://enter.converge.ai/_enter_home/landing-v2/hero/optimized/Website.png',
  site1: 'https://enter.converge.ai/_enter_home/landing-v2/hero/optimized/Website-1.png',
  site2: 'https://enter.converge.ai/_enter_home/landing-v2/hero/optimized/Website-2.png',
  hero: 'https://enter.converge.ai/_enter_home/landing-v2/hero/optimized/hero-website.png',
  enterSite: 'https://converge.ai/images/landing/enter/enter-site.png',
  builder: 'https://converge.ai/images/landing/enter/enter-builder.png',
  code: 'https://converge.ai/images/landing/enter/enter-code.png',
  board: 'https://converge.ai/images/landing/enter/enter-board.png',
  canvas: 'https://converge.ai/images/landing/framia/framia-canvas.png',
  assets: 'https://converge.ai/images/landing/framia/framia-assets.png',
  video: 'https://converge.ai/images/landing/framia/framia-video.png',
  prompt: 'https://converge.ai/images/landing/framia/framia-prompt.png',
}

const HERO = [
  {
    id: 'nova-os',
    name: 'Nova OS',
    cover: IMG.hero,
    blurb: 'Sistema operacional da agencia. Criado pelos agentes da ECC_Agencia-Loops.',
  },
  {
    id: 'pulse-ads',
    name: 'Pulso de anuncios',
    cover: IMG.enterSite,
    blurb: 'Mesa de trafego pago. Padroes varridos da internet e aplicados em loop.',
  },
  {
    id: 'studio-4k',
    name: 'Estudio 4K',
    cover: IMG.video,
    blurb: 'Laboratorio de video curto. Roteiro, corte e publicacao autonomos.',
  },
  {
    id: 'ledger',
    name: 'Carteira qualificada',
    cover: IMG.board,
    blurb: 'Pipeline que so aceita lead com encaixe. Agentes triam em tempo real.',
  },
  {
    id: 'orbit',
    name: 'Orbita SEO',
    cover: IMG.builder,
    blurb: 'Alcance organico. Busca, intencao e calendario no mesmo canvas.',
  },
]

const TRENDING = {
  template: [
    { id: 'atlas', name: 'Atlas Neural', desc: 'Painel de comando para agentes.', views: '12,4 mil', cover: IMG.site },
    { id: 'forge', name: 'Forja de interface', desc: 'Sistema visual extraido de produtos que vendem.', views: '9,8 mil', cover: IMG.code },
    { id: 'signal', name: 'Sala de sinal', desc: 'Produtividade diaria em roteiro autonomo.', views: '8,1 mil', cover: IMG.canvas },
    { id: 'store', name: 'Vitrine Nova', desc: 'Checkout e prova social testados por agentes.', views: '7,6 mil', cover: IMG.assets },
    { id: 'reel', name: 'Fabrica de Reels', desc: 'Clipes, legendas e publicacao em loop.', views: '6,9 mil', cover: IMG.site1 },
    { id: 'crm', name: 'Loop de fechamento', desc: 'Acompanhamento e venda sem operador.', views: '5,4 mil', cover: IMG.prompt },
  ],
  component: [
    { id: 'nav', name: 'Navegacao neural', desc: 'Hierarquia densa no estilo Apple.', views: '4,2 mil', cover: IMG.site2 },
    { id: 'kpi', name: 'Capsula de metricas', desc: 'Retorno e alcance em tempo real.', views: '3,9 mil', cover: IMG.board },
    { id: 'dock', name: 'Dock social', desc: 'Icones de rede ligados a agentes.', views: '3,1 mil', cover: IMG.assets },
    { id: 'form', name: 'Portao de acesso', desc: 'Login neural com varredura de acesso.', views: '2,8 mil', cover: IMG.code },
    { id: 'card', name: 'Pilha de pastas', desc: 'Pastas 3D que disparam missoes.', views: '2,5 mil', cover: IMG.canvas },
    { id: 'hero', name: 'Heroi cinematografico', desc: 'Abertura editorial de produto.', views: '2,2 mil', cover: IMG.builder },
  ],
}

const SPOTLIGHT = [
  { id: 's1', name: 'Sistema de campanha', desc: 'Do briefing ao anuncio no ar.', views: '15 mil', cover: IMG.enterSite },
  { id: 's2', name: 'Motor de entrada', desc: 'Conteudo que puxa cliente qualificado.', views: '11,3 mil', cover: IMG.site },
  { id: 's3', name: 'Malha de agentes', desc: 'Enxame coordenado em um so canvas.', views: '10,7 mil', cover: IMG.hero },
]

const EXPLORE = [
  { id: 'e1', name: 'Pulso financeiro', cover: IMG.board, type: 'modelo' },
  { id: 'e2', name: 'Sistema de saude', cover: IMG.builder, type: 'modelo' },
  { id: 'e3', name: 'Loop educacional', cover: IMG.site1, type: 'modelo' },
  { id: 'e4', name: 'Grade de varejo', cover: IMG.assets, type: 'modelo' },
  { id: 'e5', name: 'Casca SaaS', cover: IMG.code, type: 'componente' },
  { id: 'e6', name: 'Tabela de precos', cover: IMG.prompt, type: 'componente' },
]

function TypeToggle({ value, onChange }) {
  return (
    <div className="kit-toggle" role="tablist">
      <button type="button" role="tab" aria-selected={value === 'template'} className={value === 'template' ? 'on' : ''} onClick={() => onChange('template')}>
        Modelo
      </button>
      <button type="button" role="tab" aria-selected={value === 'component'} className={value === 'component' ? 'on' : ''} onClick={() => onChange('component')}>
        Componente
      </button>
    </div>
  )
}

function TrendingCard({ item }) {
  return (
    <article className="kit-row-card">
      <div className="kit-thumb">
        <img src={item.cover} alt={item.name} loading="lazy" />
        <span className="kit-badge">ECC</span>
      </div>
      <div className="kit-row-copy">
        <h3>{item.name}</h3>
        <p>{item.desc}</p>
        <span className="kit-views">{item.views} visualizacoes</span>
      </div>
    </article>
  )
}

export default function Portfolio() {
  const [hero, setHero] = useState(0)
  const [trendType, setTrendType] = useState('template')
  const [spotType, setSpotType] = useState('template')
  const current = HERO[hero]
  const trending = TRENDING[trendType]

  return (
    <section className="kit">
      <header className="kit-header">
        <h2>Kit de design</h2>
        <p>
          Modelos, componentes e pecas de vitrine no mesmo ritmo do Enter Design Kit.
          Tudo neste portfolio foi criado pelos agentes de automacao da ECC_Agencia-Loops:
          eles varrem a internet, extraem as melhores funcionalidades e os padroes visuais que convertem,
          e entregam o resultado pronto para vender.
        </p>
      </header>

      <div className="kit-hero">
        <article className="kit-hero-stage">
          <img src={current.cover} alt={current.name} />
          <div className="kit-hero-meta">
            <span>ECC_Agencia-Loops</span>
            <h3>{current.name}</h3>
            <p>{current.blurb}</p>
          </div>
        </article>
        <div className="kit-hero-strip">
          {HERO.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === hero ? 'on' : ''}
              onClick={() => setHero(index)}
              aria-label={item.name}
            >
              <img src={item.cover} alt="" />
            </button>
          ))}
        </div>
      </div>

      <section className="kit-block">
        <div className="kit-block-head">
          <div>
            <h3>Em alta</h3>
            <TypeToggle value={trendType} onChange={setTrendType} />
          </div>
          <span className="kit-viewall">Ver tudo</span>
        </div>
        <div className="kit-rows">
          <div className="kit-row">{trending.slice(0, 3).map((item) => <TrendingCard key={item.id} item={item} />)}</div>
          <div className="kit-row">{trending.slice(3, 6).map((item) => <TrendingCard key={item.id} item={item} />)}</div>
        </div>
      </section>

      <section className="kit-block">
        <div className="kit-block-head">
          <div>
            <h3>Destaque</h3>
            <TypeToggle value={spotType} onChange={setSpotType} />
          </div>
          <span className="kit-viewall">Ver tudo</span>
        </div>
        <div className="kit-row">
          {SPOTLIGHT.map((item) => <TrendingCard key={item.id} item={item} />)}
        </div>
      </section>

      <section className="kit-block">
        <div className="kit-block-head">
          <div>
            <h3>Explorar</h3>
          </div>
          <span className="kit-viewall">Ver tudo</span>
        </div>
        <div className="kit-explore">
          {EXPLORE.map((item) => (
            <article key={item.id} className="kit-guide">
              <img src={item.cover} alt={item.name} loading="lazy" />
              <div>
                <span>{item.type}</span>
                <h3>{item.name}</h3>
                <p>Gerado pelos agentes de automacao da ECC_Agencia-Loops.</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="portfolio-note">
        <p>
          <strong>Assinatura ECC_Agencia-Loops.</strong> Cada capa, componente e fluxo desta pagina
          foi produzido pelos agentes de automacao da agencia. Eles rastreiam produtos, paginas de destino
          e sistemas de elite, extraem o que funciona e aplicam no seu conjunto. O portfolio e a prova:
          produtividade no dia a dia e clientes novos, ja qualificados.
        </p>
      </aside>
    </section>
  )
}
