"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Upload,
  Brain, 
  MessageSquare, 
  Video, 
  Image as ImageIcon, 
  Lightbulb,
  Search,
  Shield,
  Folder,
  FileVideo
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Marquee } from "@/components/magicui/marquee";
import { AnimatedBeam } from "@/components/magicui/animated-beam";

export default function Home() {
  // Refs for the animated beam
  const containerRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  
  // Check if process section is in view
  const isProcessInView = useInView(containerRef, { once: false, amount: 0.5 });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const featureCardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: (i: number) => ({ 
      scale: 1, 
      opacity: 1, 
      transition: { 
        delay: 0.3 + (i * 0.1),
        type: "spring",
        stiffness: 100
      }
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Hero Section */}
      <motion.section 
        className="container mx-auto px-4 py-24 flex flex-col items-center text-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              Understand
            </span> your video content
          </h1>
        </motion.div>
        
        <motion.p 
          className="mt-6 text-xl text-muted-foreground max-w-2xl"
          variants={itemVariants}
        >
          Upload your videos and have AI analyze them frame by frame. Ask questions about what happens in your videos and get intelligent answers.
        </motion.p>
        
        <motion.div 
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          variants={itemVariants}
        >
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <Link href="/auth/register">
              Get Started Free
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/login">
              Sign In
            </Link>
          </Button>
        </motion.div>
        
        <motion.div 
          className="mt-16 relative"
          variants={itemVariants}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-30"></div>
          <div className="relative bg-background rounded-lg overflow-hidden border shadow-md">
            <Image
              src=""
              alt="Video Analysis Preview"
              width={800}
              height={450}
              className="rounded-lg object-cover"
              priority
              // Fallback to a placeholder if the image doesn't exist
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/800x450/1f2937/d1d5db?text=AI+Video+Analysis";
              }}
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.h2 
          className="text-3xl font-bold text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Unlock insights from your video content with AI
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Video Analysis",
              description: "Our AI system automatically extracts frames and analyzes the content of your videos.",
              icon: "🔍"
            },
            {
              title: "AI Chat Interface",
              description: "Ask questions about your videos and get intelligent responses based on the content.",
              icon: "💬"
            },
            {
              title: "Frame-by-Frame Processing",
              description: "The system breaks down your video into key frames for detailed understanding.",
              icon: "🖼️"
            },
            {
              title: "Video Management",
              description: "Upload, organize, and manage all your videos from a simple dashboard.",
              icon: "📁"
            },
            {
              title: "Secure & Private",
              description: "Your videos and conversations are kept private and secure.",
              icon: "🔒"
            },
            {
              title: "Advanced AI Understanding",
              description: "Powered by OpenAI's vision models for deep comprehension of visual content.",
              icon: "🧠"
            }
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={featureCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-2">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Marquee Testimonials Section */}
      <section className="py-16 overflow-hidden bg-muted/30">
        <div className="container mx-auto px-4 mb-10">
          <motion.h2 
            className="text-3xl font-bold text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            What our users are saying
          </motion.h2>
        </div>
        
        <Marquee className="py-4" pauseOnHover>
          {[
            {
              quote: "This tool helped me analyze hours of lecture videos in minutes. Game changer for my research!",
              author: "Dr. Sarah Chen, Academic Researcher"
            },
            {
              quote: "I can finally understand what happens in my product demo videos and answer customer questions accurately.",
              author: "Mark Johnson, Product Manager"
            },
            {
              quote: "The AI analysis catches details in my YouTube content that I completely missed.",
              author: "Alex Rivera, Content Creator"
            },
            {
              quote: "We use this to index our entire media archive. Search results are incredibly accurate.",
              author: "Priya Patel, Media Librarian"
            },
            {
              quote: "My students can now ask questions about lecture videos, making learning more accessible.",
              author: "Prof. James Wilson, Educator"
            }
          ].map((testimonial, i) => (
            <div key={i} className="mx-4 w-80 shrink-0">
              <Card className="h-full border border-muted-foreground/20">
                <CardContent className="pt-6">
                  <div className="mb-4 text-xl text-blue-500">"</div>
                  <p className="mb-4 italic">{testimonial.quote}</p>
                  <div className="text-sm font-medium">{testimonial.author}</div>
                </CardContent>
              </Card>
            </div>
          ))}
        </Marquee>
      </section>

      {/* Marquee Use Cases */}
      <section className="py-12 overflow-hidden">
        <div className="container mx-auto px-4 mb-8">
          <motion.h2 
            className="text-2xl font-bold text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Example questions you can ask about your videos
          </motion.h2>
        </div>
        
        <Marquee className="py-4" reverse pauseOnHover>
          {[
            "What happens at 2:15 in the video?",
            "How many people appear in this scene?",
            "What products are shown in this commercial?",
            "Summarize the key points from this lecture",
            "What is the procedure demonstrated in this tutorial?",
            "What emotion is the speaker conveying?",
            "Describe the setting of this video",
            "Are there any safety concerns in this demonstration?",
            "What text appears in this frame?",
            "What is the main topic discussed in this meeting?",
            "List all objects visible in the kitchen scene",
            "What animals appear in this nature footage?"
          ].map((question, i) => (
            <div key={i} className="mx-3 shrink-0">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-6 py-3 rounded-full">
                <span className="text-sm font-medium">{question}</span>
              </div>
            </div>
          ))}
        </Marquee>
      </section>

      {/* How It Works Section */}
      <section 
        ref={containerRef}
        className="container relative mx-auto px-4 py-24 overflow-hidden"
      >
        <motion.h2 
          className="text-3xl font-bold text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          How It Works
        </motion.h2>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-16 max-w-5xl mx-auto">
          {/* Video Upload Node */}
          <motion.div 
            ref={uploadRef}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mb-5 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Upload className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Upload Your Video</h3>
            <p className="text-muted-foreground max-w-xs">
              Easily upload any video file to our secure platform. We support most common formats.
            </p>
          </motion.div>

          {/* AI Processing Node */}
          <motion.div 
            ref={processRef}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-20 h-20 mb-5 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Brain className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Analyzes Content</h3>
            <p className="text-muted-foreground max-w-xs">
              Our system extracts key frames and uses advanced AI vision models to understand the content.
            </p>
            
            {/* Frame extraction visualization */}
            <div className="flex mt-6 gap-2">
              {[1, 2, 3].map((i) => (
                <motion.div 
                  key={i}
                  className="w-12 h-12 rounded border border-purple-500/30 bg-purple-500/5 flex items-center justify-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + (i * 0.15) }}
                >
                  <ImageIcon className="w-6 h-6 text-purple-400/70" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Chat Interface Node */}
          <motion.div 
            ref={chatRef}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="w-20 h-20 mb-5 rounded-full bg-green-500/10 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Chat About Your Video</h3>
            <p className="text-muted-foreground max-w-xs">
              Ask questions about any moment in your video and get intelligent responses based on AI analysis.
            </p>
            
            {/* Chat bubble visualization */}
            <motion.div 
              className="mt-6 bg-green-500/10 rounded-lg p-3 border border-green-500/20 text-left text-sm max-w-[200px]"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-xs font-medium mb-1">You:</p>
              <p className="text-xs text-muted-foreground">What happens at 2:15 in the video?</p>
            </motion.div>
            
            <motion.div 
              className="mt-2 bg-background rounded-lg p-3 border border-border text-left text-sm max-w-[200px]"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9 }}
            >
              <p className="text-xs font-medium mb-1 flex items-center">
                <Lightbulb className="w-3 h-3 mr-1 text-green-500" /> AI:
              </p>
              <p className="text-xs text-muted-foreground">At 2:15, the presenter is demonstrating how to connect the device to WiFi.</p>
            </motion.div>
          </motion.div>
          
          {/* Animated beams connecting the steps */}
          {isProcessInView && (
            <>
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={uploadRef}
                toRef={processRef}
                curvature={50}
                pathColor="rgba(147, 51, 234, 0.1)"
                gradientStartColor="#3b82f6"
                gradientStopColor="#8b5cf6"
                duration={2.5}
              />
              
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={processRef}
                toRef={chatRef}
                curvature={50}
                pathColor="rgba(16, 185, 129, 0.1)"
                gradientStartColor="#8b5cf6"
                gradientStopColor="#10b981"
                duration={2.5}
                delay={0.3}
              />
            </>
          )}
        </div>
        
        {/* Additional details about the process */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Video className="w-5 h-5 mr-2 text-blue-500" />
              Advanced Video Processing
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center mr-2 mt-0.5">
                  <span className="text-xs text-blue-500">1</span>
                </div>
                <span>Upload videos of any length or format</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center mr-2 mt-0.5">
                  <span className="text-xs text-blue-500">2</span>
                </div>
                <span>Automatic extraction of key frames</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center mr-2 mt-0.5">
                  <span className="text-xs text-blue-500">3</span>
                </div>
                <span>Secure storage and management of all your videos</span>
              </li>
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2 text-purple-500" />
              Intelligent AI Analysis
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center mr-2 mt-0.5">
                  <span className="text-xs text-purple-500">1</span>
                </div>
                <span>OpenAI's Vision models analyze visual content</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center mr-2 mt-0.5">
                  <span className="text-xs text-purple-500">2</span>
                </div>
                <span>Recognition of objects, people, text, and actions</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center mr-2 mt-0.5">
                  <span className="text-xs text-purple-500">3</span>
                </div>
                <span>Contextual understanding of video sequences</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <motion.section
        className="container mx-auto px-4 py-20 bg-muted/30 rounded-xl"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-center mb-4">Perfect For</h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">Our video analysis platform serves a variety of needs across different industries and use cases</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Content Creators",
              description: "Analyze your videos to improve content quality and understand audience engagement points."
            },
            {
              title: "Educators",
              description: "Make educational videos more accessible by allowing students to ask questions about the content."
            },
            {
              title: "Researchers",
              description: "Extract insights from video data without having to manually review hours of footage."
            },
            {
              title: "Media Companies",
              description: "Catalog and search video archives based on content rather than just metadata."
            }
          ].map((useCase, i) => (
            <motion.div 
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="container mx-auto px-4 py-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to understand your videos?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Join users already unlocking insights from their video content with our AI-powered analysis platform.
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <Link href="/auth/register">
              Start Analyzing Your Videos
            </Link>
          </Button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Image
              src="/next.svg"
              alt="Logo"
              width={120}
              height={30}
              className="dark:invert"
            />
            <p className="text-sm text-muted-foreground mt-2">
              © {new Date().getFullYear()} Video Analysis App. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
