import { useState } from 'react';
import { Sparkles, Users, Brain, FileText, Calendar, TrendingUp, CheckCircle, Zap, ChevronRight, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Login_Signup_Button from '@/components/auth/AuthDialog';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Screening",
      description: "Automatically evaluate resumes against job requirements with advanced AI scoring and detailed insights."
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Smart Resume Parsing",
      description: "Extract structured data from resumes instantly. Support for PDF, DOCX with intelligent entity recognition."
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Automated Interviews",
      description: "Voice AI conducts first-round interviews, transcribes responses, and provides confidence scores."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "HR teams work together seamlessly with role-based access and real-time updates."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Track hiring metrics, candidate pipelines, and AI accuracy with beautiful visualizations."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Workflow Automation",
      description: "Auto-send emails, schedule interviews, and manage candidate communications effortlessly."
    }
  ];

  const stats = [
    { value: "10x", label: "Faster Screening" },
    { value: "95%", label: "Time Saved" },
    { value: "99%", label: "Accuracy Rate" },
    { value: "24/7", label: "AI Availability" }
  ];

  const steps = [
    {
      number: "01",
      title: "Upload Job Description",
      description: "Upload your JD and let AI suggest evaluation criteria"
    },
    {
      number: "02",
      title: "Process Resumes",
      description: "Batch upload resumes and get instant AI-powered rankings"
    },
    {
      number: "03",
      title: "AI Interviews",
      description: "Voice AI conducts conversational first-round interviews"
    },
    {
      number: "04",
      title: "Hire the Best",
      description: "Review insights, schedule human interviews, and make offers"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-primary">
                RecruitAI
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-foreground hover:text-primary transition">Features</a>
              <a href="#how-it-works" className="text-foreground hover:text-primary transition">How it Works</a>
              <a href="#pricing" className="text-foreground hover:text-primary transition">Pricing</a>
              <button className="text-foreground hover:text-primary transition">Sign In</button>
              <Login_Signup_Button/>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3">
              <a href="#features" className="block text-foreground hover:text-primary py-2">Features</a>
              <a href="#how-it-works" className="block text-foreground hover:text-primary py-2">How it Works</a>
              <a href="#pricing" className="block text-foreground hover:text-primary py-2">Pricing</a>
              <button className="block w-full text-left text-foreground hover:text-primary py-2">Sign In</button>
              <Link to="/get-started">
                <button className="w-full bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition">
                  Get Started
                </button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Recruitment Platform</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Hire Smarter with{' '}
              <span className="text-primary">
                AI Intelligence
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Transform your recruitment process with AI-powered resume screening,
              automated voice interviews, and intelligent candidate matching.
              Reduce time-to-hire by 95%.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition transform hover:scale-105 flex items-center justify-center shadow-lg">
                Start Free Trial
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
              <button className="border-2 border-border text-foreground px-8 py-4 rounded-lg font-semibold hover:border-primary hover:text-primary transition">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-12 pt-8 border-t border-border">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-primary rounded-2xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition duration-300">
              <div className="bg-card rounded-xl p-6 transform -rotate-3">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary rounded-full"></div>
                      <div>
                        <div className="font-semibold text-card-foreground">Sarah Johnson</div>
                        <div className="text-sm text-muted-foreground">Senior Developer</div>
                      </div>
                    </div>
                    <div className="bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium">
                      95% Match
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Technical Skills</span>
                      <div className="flex items-center">
                        <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="w-11/12 h-full bg-primary"></div>
                        </div>
                        <span className="ml-2 text-sm font-semibold text-foreground">92%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Experience Match</span>
                      <div className="flex items-center">
                        <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="w-full h-full bg-primary"></div>
                        </div>
                        <span className="ml-2 text-sm font-semibold text-foreground">98%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cultural Fit</span>
                      <div className="flex items-center">
                        <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="w-10/12 h-full bg-primary"></div>
                        </div>
                        <span className="ml-2 text-sm font-semibold text-foreground">85%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex space-x-2">
                    <button className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                      Schedule Interview
                    </button>
                    <button className="flex-1 border border-border text-foreground py-2 rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-card rounded-lg shadow-lg p-4 border border-border animate-bounce">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm font-medium text-foreground">AI Verified</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-card rounded-lg shadow-lg p-4 border border-border">
              <div className="text-2xl font-bold text-primary">127</div>
              <div className="text-sm text-muted-foreground">Candidates Screened</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-card py-20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need to Hire Better
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to streamline your entire recruitment workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-background p-6 rounded-xl hover:shadow-xl transition transform hover:-translate-y-1 border border-border"
              >
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to transform your hiring process
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-border -ml-8"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join hundreds of companies using AI to find the perfect candidates faster
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-background text-foreground px-8 py-4 rounded-lg font-semibold hover:shadow-xl transition transform hover:scale-105">
              Start Free Trial
            </button>
            <button className="border-2 border-primary-foreground text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary-foreground hover:text-primary transition">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-muted-foreground py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-primary p-2 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">RecruitAI</span>
              </div>
              <p className="text-sm">
                AI-powered recruitment platform helping companies hire better, faster.
              </p>
            </div>

            <div>
              <h4 className="text-foreground font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary transition">Features</a></li>
                <li><a href="#" className="hover:text-primary transition">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition">API</a></li>
                <li><a href="#" className="hover:text-primary transition">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-foreground font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary transition">About</a></li>
                <li><a href="#" className="hover:text-primary transition">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-foreground font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary transition">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition">Security</a></li>
                <li><a href="#" className="hover:text-primary transition">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-center text-sm">
            <p>&copy; 2025 RecruitAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}