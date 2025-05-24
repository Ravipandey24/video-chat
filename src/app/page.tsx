"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { 
  Upload,
  Brain, 
  MessageSquare, 
  ArrowRight,
  Video, 
  Lightbulb,
  Search,
  Shield,
  Sparkles,
  ChevronRight,
  Github
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TypingEffect } from "@/components/magicui/typing-effect";
import { GradientText } from "@/components/magicui/gradient-text";
import { ShineEffect } from "@/components/magicui/shine-effect";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Marquee } from "@/components/magicui/marquee";
import { BorderBeam } from "@/components/magicui/border-beam";
import { AnimatedBeam } from "@/components/magicui/animated-beam";

export default function Home() {
  // Refs for scroll effects
  const featuresRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Use state for mouse position tracking for Aurora effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Handle mouse move for Aurora effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Add GitHub CTA in top-right corner */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20">
          <Button asChild variant="outline" size="sm" className="rounded-full border-purple-200 bg-white/90 backdrop-blur-sm">
            <Link href="https://github.com/Ravipandey24/video-chat" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Star on GitHub</span>
            </Link>
          </Button>
        </div>

        {/* Animated Grid Background */}
        <div className="absolute inset-0 -z-10 opacity-5">
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatedGrid />
          </div>
        </div>

        {/* Aurora Effects */}
        <div 
          className="absolute -z-10 rounded-full blur-3xl opacity-20 bg-purple-400 w-[40rem] h-[40rem]"
          style={{ 
            left: `calc(${mousePosition.x / 20}px - 20rem)`, 
            top: `calc(${mousePosition.y / 20}px - 20rem)`,
            transition: "left 0.5s ease-out, top 0.5s ease-out"
          }}
        />
        
        <div className="container max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                AI-powered video analysis
              </Badge>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                <span className="text-purple-600">Understand</span> your video content <br className="hidden md:block" />with AI precision
              </h1>
              
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                <TypingEffect 
                  text={[
                    "Upload your videos and have AI analyze them frame by frame.",
                    "Ask questions about what happens in your videos.",
                    "Get intelligent answers from our AI system."
                  ]}
                  speed={50}
                  repeat={true}
                  delay={3000}
                />
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-5 justify-center mb-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <ShineEffect>
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 py-6 text-base font-medium shadow-lg shadow-purple-200/50">
                  <Link href="/auth/register" className="flex items-center gap-2">
                    Get Started Free
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </ShineEffect>
              <Button asChild variant="outline" size="lg" className="border-purple-200 text-purple-700 hover:bg-purple-50 rounded-full px-8 py-6 text-base font-medium">
                <Link href="/auth/login">
                  Sign In
                </Link>
              </Button>
            </motion.div>
            
            <motion.div 
              className="relative mx-auto w-full max-w-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Card className="relative w-full bg-white border border-purple-100 rounded-2xl p-8 shadow-xl shadow-purple-100/40 hover:shadow-2xl hover:shadow-purple-200/40 transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  {/* <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full">New</div> */}
                  <div className="text-2xl font-bold text-purple-900 mb-4">
                    Video Analysis with AI
                  </div>
                  <p className="text-purple-700 text-base max-w-sm mt-3 mb-6">
                    Upload your videos and start asking questions about the content. Our AI system will analyze every frame to provide accurate answers.
                  </p>
                  <div className="relative w-full">
                    <Image
                      src="/analysis.png"
                      height="1600"
                      width="1200"
                      className="w-full object-cover rounded-xl shadow-lg"
                      alt="AI Video Analysis Dashboard"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-8">
                    <Link href="/demo" className="px-5 py-2.5 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors">
                      Try demo →
                    </Link>
                    <Link href="/auth/register" className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors">
                      Sign up now
                    </Link>
                  </div>
                </CardContent>
                <BorderBeam duration={8} size={100} />
              </Card>
              
              <div className="absolute -z-10 -bottom-6 -left-6 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-30"></div>
              <div className="absolute -z-10 -top-6 -right-6 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-white">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-purple-100 text-purple-800"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Analysis Flow
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              How Your Videos Are <span className="text-purple-600">Analyzed</span>
            </motion.h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium mb-10">
              Our advanced AI system connects multiple technologies to deliver comprehensive video analysis
            </p>
            
            <AnimatedBeamDemo />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
              {[
                {
                  icon: <Upload className="w-10 h-10 text-purple-600" />,
                  title: "Upload Video",
                  description: "Easily upload any video file to our secure platform. We support most common formats including MP4, MOV, AVI, and more."
                },
                {
                  icon: <Brain className="w-10 h-10 text-purple-600" />,
                  title: "AI Analyzes Content",
                  description: "Our system extracts key frames and uses advanced AI vision models to understand the content, context, and details in every scene."
                },
                {
                  icon: <MessageSquare className="w-10 h-10 text-purple-600" />,
                  title: "Chat About Your Video",
                  description: "Ask questions about any moment in your video and get intelligent responses based on what's happening in the footage."
                }
              ].map((step, i) => (
                <motion.div
                  key={step.title}
                  className="bg-white p-8 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl hover:border-purple-200 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                >
                  <div className="mb-6 inline-flex items-center justify-center p-4 bg-purple-100 rounded-xl">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-purple-900">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Section - Technologies */}
      <section className="py-12 bg-slate-50">
        <div className="container max-w-6xl mx-auto px-6 mb-6">
          <h3 className="text-lg font-medium text-center text-slate-500 mb-6">Powered by cutting-edge technologies</h3>
        </div>
        <Marquee className="py-4" pauseOnHover>
          {[
            "Next.js", 
            "React", 
            "TailwindCSS", 
            "Framer Motion", 
            "OpenAI API", 
            "FFmpeg", 
            "Computer Vision", 
            "GPT-4 Vision", 
            "WebRTC", 
            "Drizzle"
          ].map((tech) => (
            <div key={tech} className="mx-8 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-600"></div>
              <span className="text-xl font-semibold text-slate-700">{tech}</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-white">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-purple-100 text-purple-800"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Use Cases
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Perfect <span className="text-purple-600">For</span>
            </motion.h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">
              Our video analysis platform serves a variety of needs across different industries
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Video className="w-8 h-8 text-purple-600" />,
                title: "Content Creators",
                description: "Analyze your videos to improve content quality and understand audience engagement points. Perfect for YouTubers and social media influencers.",
                link: "Learn more"
              },
              {
                icon: <Lightbulb className="w-8 h-8 text-purple-600" />,
                title: "Educators",
                description: "Make educational videos more accessible by allowing students to ask questions about the content. Ideal for online courses and virtual classrooms.",
                link: "Learn more"
              },
              {
                icon: <Search className="w-8 h-8 text-purple-600" />,
                title: "Researchers",
                description: "Extract insights from video data without having to manually review hours of footage. Saves time for academic and scientific research projects.",
                link: "Learn more"
              },
              {
                icon: <Shield className="w-8 h-8 text-purple-600" />,
                title: "Media Companies",
                description: "Catalog and search video archives based on content rather than just metadata. Transform how you manage your media library.",
                link: "Learn more"
              }
            ].map((useCase, i) => (
              <motion.div 
                key={useCase.title}
                className="bg-white p-8 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl hover:border-purple-200 transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
              >
                <div className="mb-5 inline-flex items-center justify-center p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">{useCase.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-purple-900">{useCase.title}</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">{useCase.description}</p>
                <a href="#" className="text-purple-600 font-medium inline-flex items-center hover:text-purple-800 transition-colors">
                  {useCase.link}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: "10M+", label: "Video minutes analyzed" },
              { number: "25k+", label: "Active users" },
              { number: "99.8%", label: "Accuracy rate" }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                className="text-center p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
              >
                <h3 className="text-5xl font-bold text-purple-600 mb-2">{stat.number}</h3>
                <p className="text-slate-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-12 text-center max-w-5xl mx-auto shadow-2xl shadow-purple-200/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <AnimatedGrid />
            </div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
            
            <motion.div
              className="relative z-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl font-bold mb-6 text-white leading-tight">Ready to understand your videos?</h2>
              <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto font-medium">
                Join users already unlocking insights from their video content with our AI-powered analysis platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <ShineEffect shimmerColor="rgba(255,255,255,0.5)">
                  <Button asChild size="lg" className="bg-white hover:bg-purple-50 text-purple-700 rounded-full px-8 py-6 text-base font-medium shadow-xl">
                    <Link href="/auth/register" className="flex items-center gap-2">
                      Start Analyzing Your Videos
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </ShineEffect>
                
                <Button asChild variant="outline" size="lg" className="border-purple-300 text-white hover:bg-purple-500/20 rounded-full px-8 py-6 text-base font-medium">
                  <Link href="/pricing">
                    View Pricing
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-purple-100 bg-white">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="col-span-1 md:col-span-1">
              <Image
                src="/next.svg"
                alt="Logo"
                width={120}
                height={30}
                className="mb-4"
              />
              <p className="text-slate-500 mb-6">
                AI-powered video analysis and understanding platform.
              </p>
              <div className="flex items-center gap-3 mb-4">
                <Link 
                  href="https://github.com/Ravipandey24/video-chat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-600 hover:text-purple-700 transition-colors"
                >
                  <Github className="w-5 h-5" />
                  <span className="text-sm font-medium">GitHub Repository</span>
                </Link>
              </div>
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} Video Analysis App
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-purple-900">Product</h4>
              <ul className="space-y-2">
                {[
                  { name: "Features", href: "/features" },
                  { name: "Pricing", href: "/pricing" },
                  { name: "Use Cases", href: "/use-cases" },
                  { name: "Integrations", href: "/integrations" }
                ].map(item => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-slate-600 hover:text-purple-700 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-purple-900">Company</h4>
              <ul className="space-y-2">
                {[
                  { name: "About", href: "/about" },
                  { name: "Blog", href: "/blog" },
                  { name: "Careers", href: "/careers" },
                  { name: "Contact", href: "/contact" }
                ].map(item => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-slate-600 hover:text-purple-700 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-purple-900">Legal</h4>
              <ul className="space-y-2">
                {[
                  { name: "Terms", href: "/legal/terms" },
                  { name: "Privacy", href: "/legal/privacy" },
                  { name: "Cookies", href: "/legal/cookies" },
                  { name: "Licenses", href: "/legal/licenses" }
                ].map(item => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-slate-600 hover:text-purple-700 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Animated Grid component
const AnimatedGrid = () => {
  return (
    <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] w-full h-full">
      {Array.from({ length: 400 }).map((_, i) => (
        <div 
          key={i} 
          className={`border border-purple-100/20 ${
            Math.random() > 0.93 ? 'bg-purple-100/30' : ''
          }`}
          style={{
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 5}s`
          }}
        />
      ))}
    </div>
  );
};

function AnimatedBeamDemo() {
  const containerRef = useRef(null);
  const div1Ref = useRef(null);
  const div2Ref = useRef(null);
  const div3Ref = useRef(null);
  const div4Ref = useRef(null);
  const div5Ref = useRef(null);
  const div6Ref = useRef(null);
  const div7Ref = useRef(null);

  return (
    <div
      className="relative flex h-[300px] w-full items-center justify-center overflow-hidden p-10"
      ref={containerRef}
    >
      <div className="flex size-full max-h-[200px] max-w-lg flex-col items-stretch justify-between gap-10">
        <div className="flex flex-row items-center justify-between">
          <div ref={div1Ref} className="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]">
            <Upload className="w-6 h-6 text-purple-600" />
          </div>
          <div ref={div5Ref} className="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div className="flex flex-row items-center justify-between">
          <div ref={div2Ref} className="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]">
            <Video className="w-6 h-6 text-purple-600" />
          </div>
          <div ref={div4Ref} className="z-10 flex size-16 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <div ref={div6Ref} className="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]">
            <Search className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div className="flex flex-row items-center justify-between">
          <div ref={div3Ref} className="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]">
            <Lightbulb className="w-6 h-6 text-purple-600" />
          </div>
          <div ref={div7Ref} className="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div4Ref}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        reverse
      />
    </div>
  );
}
