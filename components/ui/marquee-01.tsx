import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/marquee-01-utils/marquee";

const reviews = [
  {
    name: "Amina W.",
    location: "Kampala, Uganda",
    result: "+18 min Life Gained/Day",
    quote: "I swapped white rice for cauliflower rice. Didn't think it would make a difference. My energy levels completely transformed within 2 weeks.",
    avatar: "/images/amina_40plus_1788156836990.png"
  },
  {
    name: "Marcus T.",
    location: "London, UK",
    result: "+24 min Life Gained/Day",
    quote: "The Life Gain counter is what hooked me. It's oddly addictive seeing minutes stack up. I'm up 24 minutes a day just from diet swaps.",
    avatar: "/images/marcus_40plus_1788156850933.png"
  },
  {
    name: "Wanjiru K.",
    location: "Nairobi, Kenya",
    result: "+31 min Life Gained/Day",
    quote: "Finally, nutrition content that doesn't read like a supplement ad. Just the science in 2 minutes. My whole family has changed how we eat.",
    avatar: "/images/wanjiru_40plus_1788156865208.png"
  },
  {
    name: "Yuki H.",
    location: "Tokyo, Japan",
    result: "+22 min Life Gained/Day",
    quote: "Eating traditional Japanese foods with a longevity twist has been life-changing. The personalized plan makes it so simple and intuitive to follow every day.",
    avatar: "/images/yuki_40plus.png"
  },
  {
    name: "Min-jun P.",
    location: "Seoul, South Korea",
    result: "+15 min Life Gained/Day",
    quote: "I was skeptical at first, but adjusting my macros based on the science here gave me an incredible energy boost. I feel younger than I did ten years ago.",
    avatar: "/images/minjun_40plus.png"
  },
  {
    name: "Sarah M.",
    location: "Toronto, Canada",
    result: "+27 min Life Gained/Day",
    quote: "The science-backed feed is my morning reading now. It's easy to digest and immediately applicable. My biological clock is definitely thanking me.",
    avatar: "/images/sarah_40plus.png"
  },
  {
    name: "Liam C.",
    location: "Sydney, Australia",
    result: "+19 min Life Gained/Day",
    quote: "Making small swaps down under! Didn't have to give up my favorite meals, just tweaked them. The extra minutes gained feel very real when I'm surfing.",
    avatar: "/images/liam_40plus.jpg"
  },
  {
    name: "David R.",
    location: "Austin, Texas",
    result: "+21 min Life Gained/Day",
    quote: "I used to rely on energy drinks. Since taking the quiz and shifting my eating habits, I'm firing on all cylinders naturally. Best decision ever.",
    avatar: "/images/david_40plus.jpg"
  },
  {
    name: "Emma S.",
    location: "Berlin, Germany",
    result: "+25 min Life Gained/Day",
    quote: "German efficiency applied to health! The daily plan is completely stress-free. Watching the life gain tracker go up gives me peace of mind.",
    avatar: "/images/emma_40plus.jpg"
  },
  {
    name: "Lucia M.",
    location: "Rome, Italy",
    result: "+28 min Life Gained/Day",
    quote: "I love that I can still enjoy Mediterranean flavors while optimizing for longevity. The science is sound, and the results speak for themselves.",
    avatar: "/images/lucia_40plus.jpg"
  }
];

const firstRow = reviews.slice(0, 5);
const secondRow = reviews.slice(5, 10);

const ReviewCard = ({
  avatar,
  name,
  location,
  result,
  quote,
}: {
  avatar: string;
  name: string;
  location: string;
  result: string;
  quote: string;
}) => {
  return (
    <div className="lc-testimonial-stack w-[340px] h-full mx-4">
      <Card className="lc-testimonial-card relative h-full w-full cursor-pointer overflow-hidden border-border bg-[#111417] border-white/10 shadow-none transition-colors hover:border-[#22FF00]/40 flex flex-col rounded-[20px]">
        {/* 
          Using inline styles to enforce spacing from card edges.
          padding-top & padding-left = 32px pushes avatar/name away from top & left edges.
          padding-right & padding-bottom = 24px keeps the rest balanced.
        */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '32px',
            paddingLeft: '32px',
            paddingRight: '24px',
            paddingBottom: '24px',
          }}
        >

          {/* Header: Avatar on left, Name + Location on right */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Profile picture — perfect circle with green border */}
            <img
              alt={name}
              src={avatar}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(34, 255, 0, 0.4)',
                flexShrink: 0,
              }}
            />
            {/* Name and location text */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                textAlign: 'left',
                marginTop: '4px',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {name}
              </p>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#9aa0a6',
                  margin: 0,
                  marginTop: '2px',
                  lineHeight: 1.3,
                }}
              >
                📍 {location}
              </p>
            </div>
          </div>

          {/* Centered Green Badge */}
          <div className="flex w-full justify-center">
            <div className="bg-[#22FF00]/10 border border-[#22FF00]/35 text-[#22FF00] text-[11px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap">
              {result}
            </div>
          </div>

          {/* Stars & Quote */}
          <div className="text-center">
            <div className="text-[#22FF00] text-[13.5px] tracking-[2px] mb-1">★★★★★</div>
            <p className="text-[14.5px] line-clamp-2 text-[#c9ccd1] italic leading-[1.6]">"{quote}"</p>
          </div>

        </div>
      </Card>
    </div>
  );
};

export default function TestimonialMarqueeDemo() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      
      {/* First row of scrolling cards */}
      <div className="w-full" style={{ marginBottom: '48px' }}>
        <Marquee pauseOnHover className="[--duration:30s]">
          {firstRow.map((review, i) => (
            <ReviewCard key={`row1-${i}`} {...review} />
          ))}
        </Marquee>
      </div>

      {/* Second row of scrolling cards — 48px gap from first row */}
      <div className="w-full" style={{ marginTop: '0px' }}>
        <Marquee reverse pauseOnHover className="[--duration:30s]">
          {secondRow.map((review, i) => (
            <ReviewCard key={`row2-${i}`} {...review} />
          ))}
        </Marquee>
      </div>

      <div className="from-[#0a0e12] pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r"></div>
      <div className="from-[#0a0e12] pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l"></div>
    </div>
  );
}
