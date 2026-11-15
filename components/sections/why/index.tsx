// Why it matters: Symbol's diverging chart (symbolstudio.pl/en, "Why is branding so important?") on
// our ground. A two-line legend, then the chart: the gain bar runs to the right edge with its figure
// above, closed by a thin rule; the loss ticks run from the left edge and dwindle, figure below, opened
// by a rule. The gain bar is a ribbon fan (ribbon-fan.tsx). FIGURES ARE PLACEHOLDERS.
import { home } from "@/content/home";
import { vars } from "@/lib/utils";
import { RibbonFan } from "./ribbon-fan";
import s from "./why.module.css";

const range = ([a, b]: readonly [number, number] | readonly number[]) => `${a}–${b}%`;

export function Why() {
  const { title, statement, legend, chart, refs } = home.why;
  return (
    <section className={`section grid-12 ${s.why}`} aria-labelledby="why-title">
      <h2 className="s-title in" id="why-title" data-reveal="fade">{title}</h2>
      <p className={`big-type ${s.statement}`} data-reveal="fade">{statement}</p>

      <ul className={s.legend}>
        <li data-reveal="fade" data-delay="0.1"><i className={s.kLoss} aria-hidden />{legend.loss}</li>
        <li data-reveal="fade" data-delay="0.2"><i className={s.kGain} aria-hidden />{legend.gain}</li>
      </ul>

      <div className={s.chart} role="img" aria-label={chart.label} data-reveal="fade">
        <div className={`${s.fig} ${s.gain}`}>
          <h3>{chart.gain.title}</h3>
          <span className={s.n} data-count={chart.gain.range.join(",")} data-sign="+">+{range(chart.gain.range)}</span>
        </div>
        <RibbonFan className={s.bar} />
        <div className={s.ticks} data-wipe />
        <div className={`${s.fig} ${s.loss}`}>
          <h3>{chart.loss.title}</h3>
          <span className={s.n} data-count={chart.loss.range.join(",")} data-sign="−">−{range(chart.loss.range)}</span>
        </div>
      </div>

      {/* who it worked for: their marks in grey, not ours, so they never read as clients */}
      <div className={s.refs}>
        <h3 data-reveal="fade">{refs.title}</h3>
        <ul>
          {refs.items.map((r, i) => (
            <li key={r.alt} data-reveal="fade" data-delay={(0.1 + i * 0.08).toFixed(2)}>
              <img src={r.src} alt={r.alt} style={vars({ "--a": r.aspect })} />
              <p>{r.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
