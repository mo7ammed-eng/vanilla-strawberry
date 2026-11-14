import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Leaf, Snowflake } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export const metadata = {
  title: "Our story",
  description: "How Vanilla & Strawberry makes small-batch gelato in Brooklyn, slowly and with real fruit.",
};

export default function StoryPage() {
  return (
    <>
      <section className="border-b border-border-warm bg-vanilla-0/60">
        <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-20">
          <div className="max-w-xl">
            <p className="eyebrow">Our story</p>
            <h1 className="mt-4 text-h1">We started with one flavour and a stubborn idea.</h1>
            <p className="mt-5 text-sm leading-relaxed text-ink-600 sm:text-base">
              That gelato should taste like the fruit it came from, not like a flavour label. So we
              began roasting strawberries in the back of a tiny Brooklyn kitchen, steeping vanilla
              overnight, and churning in batches small enough to taste every one.
            </p>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-vanilla-200">
            <Image
              src="/images/vanilla-bean.jpg"
              alt="Madagascar vanilla gelato in a bowl"
              fill
              priority
              sizes="(min-width: 1024px) 44vw, 92vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-vanilla-200">
            <Image
              src="/images/strawberry-cloud.jpg"
              alt="Strawberry gelato with fresh berries"
              fill
              sizes="(min-width: 1024px) 44vw, 92vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-3 hidden w-44 overflow-hidden rounded-xl border-4 border-vanilla-50 sm:block">
            <div className="relative aspect-square">
              <Image src="/images/lemon-basil.jpg" alt="Lemon basil sorbet" fill sizes="200px" className="object-cover" />
            </div>
          </div>
        </div>
        <div className="max-w-lg">
          <p className="eyebrow">The way we work</p>
          <h2 className="mt-4 text-h2">Slow is not a gimmick. It is the recipe.</h2>
          <p className="mt-5 text-sm leading-relaxed text-ink-600 sm:text-base">
            Fruit is macerated, never cooked into jam. Nuts are roasted in-house and ground while
            warm. Dairy comes from a small Hudson Valley farm. Everything is churned the morning it
            is served, because the difference is real and you can taste it.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
            We keep the menu short on purpose. If a flavour is not at its best, it comes off the
            board until the fruit catches up. That means some favourites disappear for a season. We
            think that is a fair trade.
          </p>

          <div className="mt-8 grid gap-5 border-t border-border-warm pt-6 sm:grid-cols-3">
            {[
              { icon: Leaf, title: "Real fruit", text: "Macerated, not concentrated." },
              { icon: Snowflake, title: "Churned daily", text: "Small batches, never held over." },
              { icon: Heart, title: "Made here", text: "Every batch made in Brooklyn." },
            ].map((item) => (
              <div key={item.title}>
                <item.icon className="h-4 w-4 text-strawberry-600" />
                <p className="mt-2 text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border-warm bg-vanilla-0/70">
        <div className="container-page py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-3">
            {[
              {
                number: "01",
                title: "Choose the fruit",
                text: "We buy what is ripe, not what is on a year-round list. The menu follows the market.",
              },
              {
                number: "02",
                title: "Take your time",
                text: "Steeping, roasting and macerating happen the day before. Nothing is rushed to the case.",
              },
              {
                number: "03",
                title: "Churn small",
                text: "Twenty-four litres at a time, early in the morning, so every serving is the same day's work.",
              },
            ].map((step) => (
              <div key={step.number} className="border-t border-ink-900 pt-5">
                <p className="font-display text-3xl text-strawberry-600">{step.number}</p>
                <h2 className="mt-3 text-xl">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-lg">
            <p className="eyebrow">The room</p>
            <h2 className="mt-4 text-h2">Come for the gelato. Stay for the afternoon.</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
              The restaurant is a small room with warm light, a marble counter, and a courtyard that
              is best in the late afternoon. There is no rush here. Order a scoop, take a seat, and
              let the day slow down.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/menu" className={buttonClasses("primary", "md")}>
                Explore the menu
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/gallery" className={buttonClasses("secondary", "md")}>
                See the room
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["/images/pistachio-rose.jpg", "/images/burnt-honey.jpg", "/images/fig-ricotta.jpg", "/images/coconut-lime.jpg"].map(
              (src, index) => (
                <div
                  key={src}
                  className={`relative overflow-hidden rounded-xl bg-vanilla-100 ${
                    index === 1 ? "mt-6 aspect-square" : "aspect-[3/4]"
                  }`}
                >
                  <Image src={src} alt="Dessert from the restaurant" fill sizes="(min-width: 1024px) 24vw, 46vw" className="object-cover" />
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </>
  );
}
