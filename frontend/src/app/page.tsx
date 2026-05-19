import Link from 'next/link'
import { ArrowRight, BookOpen, Users, Award, TrendingUp, Star, CheckCircle, Zap } from 'lucide-react'

const features = [
  { icon: BookOpen, title: 'Expert-Led Courses', desc: 'Learn from industry professionals with real-world experience across 50+ categories.' },
  { icon: Users, title: 'Vibrant Community', desc: 'Connect with learners, join study groups, and participate in forums.' },
  { icon: Award, title: 'Earn Certifications', desc: 'Get verified certificates that showcase your skills to employers.' },
  { icon: TrendingUp, title: 'Track Progress', desc: 'Detailed analytics help you understand your learning patterns.' },
  { icon: Star, title: 'Gamified Learning', desc: 'Earn XP, badges, and climb leaderboards to stay motivated.' },
  { icon: Zap, title: 'Live Sessions', desc: 'Attend real-time interactive sessions with instructors.' },
]

const stats = [
  { value: '50K+', label: 'Active Learners' },
  { value: '1,200+', label: 'Expert Courses' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '200+', label: 'Instructors' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">G</span>
            </div>
            <span className="font-bold text-lg">Grove</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-1.5 rounded-full mb-6">
            <Zap className="h-3.5 w-3.5" />
            <span>The social learning platform for the modern era</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
            Learn Together,{' '}
            <span className="text-primary">Grow Together</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Grove combines world-class courses, live sessions, mentorship, and a vibrant community to supercharge your learning journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Learning Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-border px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-accent transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-primary">{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything you need to succeed</h2>
            <p className="text-muted-foreground text-lg">A complete learning ecosystem designed for modern learners.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 rounded-xl hover:shadow-md transition-shadow">
                <div className="h-11 w-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to start your learning journey?</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Join thousands of learners already growing with Grove. It's free to get started.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-foreground/90 transition-colors"
          >
            Create Free Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Grove. All rights reserved.</p>
      </footer>
    </div>
  )
}
