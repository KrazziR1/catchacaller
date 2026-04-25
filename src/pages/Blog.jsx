import { useParams } from "react-router-dom";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";

const blogPosts = [
  {
    id: "missed-calls-costing-business",
    title: "Are Missed Calls Costing Your Business More Than You Think?",
    author: "CatchACaller Team",
    date: "April 24, 2026",
    excerpt: "Discover how missed calls impact your bottom line and why AI-powered call recovery is essential.",
    content: `
      <p>Every missed call is a lost opportunity. For service businesses like HVAC contractors, plumbers, and roofing companies, a single missed call can mean losing a potential $500-$5,000+ job.</p>

      <h2>The Real Cost of Missed Calls</h2>
      <p>Studies show that:</p>
      <ul>
        <li>50% of customers won't leave a voicemail</li>
        <li>The average small business misses 32% of incoming calls</li>
        <li>A missed call leads to a missed opportunity 90% of the time</li>
      </ul>

      <p>If you're in a service industry averaging $2,000 per job and missing 10 calls per week, you're losing $1.04 million annually in potential revenue.</p>

      <h2>Why Traditional Solutions Fall Short</h2>
      <p>Hiring staff to answer every call is expensive and impractical. Voicemail-only strategies lose leads before they even leave a message. Auto-responders feel robotic and don't drive conversions.</p>

      <p>What if you could respond to every missed call in seconds with a personalized, AI-powered message that actually books appointments?</p>

      <h2>The CatchACaller Solution</h2>
      <p>CatchACaller automatically:</p>
      <ul>
        <li>Detects missed calls instantly</li>
        <li>Sends personalized SMS within seconds</li>
        <li>Qualifies leads with conversational AI</li>
        <li>Books appointments directly</li>
        <li>Follows up automatically if no response</li>
      </ul>

      <p>Our customers see a 67% lead reply rate and 38% conversion to bookings. That missed call? Now it's a booked job.</p>

      <h2>The Bottom Line</h2>
      <p>In today's market, speed wins. The business that responds first captures the lead. CatchACaller ensures you're always first—even when you can't answer the phone.</p>

      <p>Stop leaving money on the table. Start recovering missed calls today.</p>
    `,
  },
];

export default function Blog() {
  const { slug } = useParams();

  if (slug) {
    const post = blogPosts.find((p) => p.id === slug);

    if (!post) {
      return (
        <div className="min-h-screen bg-background">
          <LandingNav />
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <h1 className="text-3xl font-bold mb-4">Post not found</h1>
            <Link to="/blog">
              <Button variant="outline">Back to Blog</Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <LandingNav />
        <article className="max-w-3xl mx-auto px-6 py-12">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="space-y-6 mb-12">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {post.date}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {post.author}
              </div>
            </div>
          </div>

          <div className="prose prose-sm max-w-none mb-12 text-foreground">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </article>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-extrabold mb-4">Blog</h1>
        <p className="text-muted-foreground mb-12">Insights on missed call recovery and business growth.</p>

        <div className="space-y-6">
          {blogPosts.map((post) => (
            <Link key={post.id} to={`/blog/${post.id}`}>
              <div className="p-6 rounded-xl border border-border hover:border-primary hover:bg-card/50 transition-all cursor-pointer">
                <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{post.date}</span>
                  <span>By {post.author}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}