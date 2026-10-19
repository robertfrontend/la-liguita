/* Plain anchors keep the public landing free of the client router. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { Barlow, Barlow_Condensed } from "next/font/google";
import { listPublicTournaments, type PublicLeague } from "@/lib/public-tournaments";
import "./landing.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-barlow",
});

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: "700",
  display: "swap",
  variable: "--font-display",
});

export const revalidate = 300;

const sportLabel: Record<PublicLeague["sport"], string> = {
  basketball: "Baloncesto",
  soccer: "Fútbol",
};

const statusLabel: Record<string, string> = {
  draft: "En preparación",
  active: "En juego",
  playoffs: "Playoffs",
  finished: "Cerrada",
};

export default async function HomePage() {
  const leagues = await listPublicTournaments();

  return (
    <div className={`ll-home ${barlow.variable} ${display.variable}`}>
      <a className="ll-skip" href="#contenido">
        Saltar al contenido
      </a>
      <div className="ll-wrap">
        <header className="ll-bar">
          <a className="ll-brand" href="/">
            <picture>
              <source
                type="image/avif"
                srcSet="/logo-64.avif 1x, /logo-128.avif 2x"
              />
              <source
                type="image/webp"
                srcSet="/logo-64.webp 1x, /logo-128.webp 2x"
              />
              <img src="/logo-64.png" width={32} height={32} alt="" />
            </picture>
            <strong>La Liguita</strong>
          </a>
          <nav className="ll-nav" aria-label="Principal">
            <a href="#ligas">Ligas</a>
            <a href="/login">Entrar</a>
          </nav>
        </header>

        <main id="contenido">
          <section className="ll-hero">
            <div>
              <h1>La liga, con el marcador al día.</h1>
              <div className="ll-rule" aria-hidden="true" />
              <p className="ll-lede">
                La Liguita es el portal de las ligas amateur: el resultado en vivo,
                las plantillas y las estadísticas, con el calendario de quien organiza.
              </p>
              <div className="ll-actions">
                <a className="ll-btn" href="#ligas">
                  Ver ligas
                </a>
                <a className="ll-textlink" href="/login">
                  Empezar a gestionar
                </a>
              </div>
            </div>

            <div>
            <figure className="ll-board" aria-labelledby="portal-ejemplo">
              <div className="ll-board-head">
                <div className="ll-mark" aria-hidden="true">
                  H
                </div>
                <p>
                  <small>Liga del barrio</small>
                  <strong>Halcones contra Tigres</strong>
                </p>
              </div>
              <div className="ll-tabs" aria-hidden="true">
                <span className="is-on">Calendario</span>
                <span>Posiciones</span>
                <span>Líderes</span>
                <span>Clubes</span>
              </div>
              <div className="ll-game">
                <div className="ll-game-top">
                  <span>Jornada 4, cancha principal</span>
                  <b>Final</b>
                </div>
                <div className="ll-team">
                  <span>Halcones</span>
                  <b>64</b>
                </div>
                <div className="ll-team is-behind">
                  <span>Tigres</span>
                  <b>58</b>
                </div>
                <p className="ll-note">Mejor anotación del partido, 22 pts</p>
              </div>
              <div className="ll-standings">
                <p>Posiciones</p>
                <ol>
                  <li>
                    <span>1</span>
                    <span>Halcones</span>
                    <span>6-1</span>
                  </li>
                  <li>
                    <span>2</span>
                    <span>Tigres</span>
                    <span>5-2</span>
                  </li>
                  <li>
                    <span>3</span>
                    <span>Leones</span>
                    <span>4-3</span>
                  </li>
                </ol>
              </div>
            </figure>
            <p id="portal-ejemplo" className="ll-caption">
              Así se ve el portal de una liga: marcador, plantilla y tabla.
            </p>
            </div>
          </section>

          <section className="ll-section" aria-labelledby="beneficios-titulo">
            <div className="ll-split">
              <h2 id="beneficios-titulo">Para el día del partido</h2>
              <dl className="ll-benefits">
                <div className="ll-benefit">
                  <dt>Marcador en vivo</dt>
                  <dd>
                    El tanteo cambia mientras se juega. Quien sigue la liga desde
                    casa ve el mismo número que en la mesa.
                  </dd>
                </div>
                <div className="ll-benefit">
                  <dt>Plantillas</dt>
                  <dd>
                    Cada equipo publica su lista: nombres, dorsales y club, en el
                    portal de la liga.
                  </dd>
                </div>
                <div className="ll-benefit">
                  <dt>Estadísticas</dt>
                  <dd>
                    Puntos, asistencias y líderes salen de lo que se anota en el
                    partido.
                  </dd>
                </div>
                <div className="ll-benefit">
                  <dt>Gestión de la liga</dt>
                  <dd>
                    Calendario, actas y el acceso de quien organiza, en un solo
                    panel.
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="ll-section" id="ligas" aria-labelledby="ligas-titulo">
            <h2 id="ligas-titulo">Ligas</h2>
            <p className="ll-intro">
              Entra al portal de una liga para ver el calendario, las posiciones y
              los líderes.
            </p>
            {leagues.length > 0 ? (
              <ul className="ll-leagues">
                {leagues.map((league) => {
                  const bits = [
                    league.organizationName,
                    sportLabel[league.sport],
                    league.status ? statusLabel[league.status] : undefined,
                  ].filter(Boolean);
                  return (
                    <li key={league.id}>
                      <a href={`/t/${encodeURIComponent(league.slug)}`}>
                        <span className="ll-league-name">{league.name}</span>
                        <span className="ll-league-meta">{bits.join(", ")}</span>
                        <span className="ll-league-meta">Ver portal</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="ll-empty">
                Cuando haya ligas publicadas, aparecen aquí. Si organizas una,
                ábrela desde el panel.
              </p>
            )}
          </section>

          <section className="ll-section ll-close" aria-labelledby="empezar-titulo">
            <h2 id="empezar-titulo">Arma tu liga</h2>
            <p>
              Crea el torneo, carga los equipos y abre el marcador el día del
              partido.
            </p>
            <div>
              <a className="ll-btn" href="/login">
                Empezar a gestionar
              </a>
            </div>
          </section>
        </main>

        <footer className="ll-foot">La Liguita</footer>
      </div>
    </div>
  );
}
