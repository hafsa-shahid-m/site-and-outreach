import VarChip from "../../components/VarChip";

export const metadata = { title: "Style" };

const SIZES = ["--size--1", "--size-0", "--size-1", "--size-2", "--size-3"];
const SPACES = ["--space-1", "--space-2", "--space-3", "--space-4", "--space-5", "--space-6", "--space-7"];
const COLOURS = ["--bg", "--ink", "--muted", "--accent"];
const OTHER = ["--measure", "--leading", "--border-width", "--focus-width", "--font-body"];

// YOUR TURN start decisions
// Chapter 2.13. Write your four decisions. Each has a choice, a reason and what you rejected.
const decisions: { title: string; choice: string; reason: string; rejected: string }[] = [];
// YOUR TURN end decisions

export default function StylePage() {
  return (
    <main>
      <h1>Style</h1>
      <p>Every variable this site is built from, shown as it is used. A red chip says a value is missing.</p>

      <section aria-labelledby="sizes-heading">
        <h2 id="sizes-heading">Sizes</h2>
        {SIZES.map((name) => (
          <div key={name} style={{ fontSize: `var(${name})` }}>
            <VarChip name={name} />
          </div>
        ))}
      </section>

      <section aria-labelledby="space-heading">
        <h2 id="space-heading">Spacing</h2>
        {SPACES.map((name) => (
          <div key={name} className="space-row">
            <VarChip name={name} />
            <div className="space-bar" style={{ width: `var(${name})` }} />
          </div>
        ))}
      </section>

      <section aria-labelledby="colour-heading">
        <h2 id="colour-heading">Colour</h2>
        {COLOURS.map((name) => (
          <div key={name} className="swatch-row">
            <div className="swatch" style={{ background: `var(${name})` }} />
            <VarChip name={name} />
          </div>
        ))}
      </section>

      <section aria-labelledby="other-heading">
        <h2 id="other-heading">Width, line height, borders and typeface</h2>
        {OTHER.map((name) => (
          <p key={name}>
            <VarChip name={name} />
          </p>
        ))}
      </section>

      <section aria-labelledby="decisions-heading">
        <h2 id="decisions-heading">Four decisions</h2>
        {decisions.map((decision) => (
          <article key={decision.title} className="card" data-decision>
            <h3>{decision.title}</h3>
            <p>
              <span className="label">Choice</span> {decision.choice}
            </p>
            <p>
              <span className="label">Reason</span> {decision.reason}
            </p>
            <p>
              <span className="label">Rejected</span> {decision.rejected}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
