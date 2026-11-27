import { projects } from "../projects";

export default function Home() {
  return (
    <main>
      {/* YOUR TURN start home-hero */}
      <h1>
        I'm Hafsa Shahid, a final-year computer science student who builds
        full-stack and AI apps; my latest is SaveBite, a Flutter app that
        reminds you before groceries go bad and suggests what to cook with them.
      </h1>
      <p>
        I'm looking for a junior full-stack role starting June 2027, or an
        internship sooner; email me at hafsashahid.m@gmail.com.
      </p>
      {/* YOUR TURN end home-hero */}
      {/* YOUR TURN start project-cards */}
      <h2>SaveBite</h2>
      <p>My team of three built a Flutter app that tracks the food in your fridge, reminds you before it expires, and suggests recipes from what you already have.</p>
      <p>When families buy groceries in bulk and life gets busy, we forget what we already bought. We only find those items when cleaning the fridge or when it is almost empty, and by then they have often gone bad.</p>
      <p>A friend tested it on her own fridge, and SaveBite reminded her about bread and eggs she had forgotten were sitting there.</p>
      <p><a href="https://www.figma.com/proto/E1D23xc6P5X4TbzC1G8ie2/SaveBite?node-id=0-1">Figma prototype</a>. The code is in a private team repo.</p>
      <h2>SaveBite</h2>
      <p>
        What. My team of three built a Flutter app that tracks the food in your
        fridge, reminds you before it expires, and suggests recipes from what
        you already have.
      </p>
      <p>
        Why. When families buy groceries in bulk and life gets busy, we forget
        what we already bought. We only find those items when cleaning the
        fridge or when it is almost empty, and by then they have often gone bad.
      </p>
      <p>
        Result. I designed all 12 screens in Figma and made 71 of our 129
        commits; the app runs on Android with sign-in, expiry reminders, an AI
        chef and food sharing with chat.
      </p>
      <p>
        Link.{" "}
        <a href="https://www.figma.com/proto/E1D23xc6P5X4TbzC1G8ie2/SaveBite?node-id=0-1">
          Figma prototype
        </a>
        . The code is in a private team repo.
      </p>
      {/* YOUR TURN end project-cards */}
    </main>
  );
}
