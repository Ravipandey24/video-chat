"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import {
  Menu,
  X,
  ChevronDown,
  Upload,
  LayoutDashboard,
  LogOut,
  User,
  Video,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: Session["user"];
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Check if a path is active
  const isActive = (path: string) => pathname === path;

  // Navigation links
  const navLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4 mr-2" />,
    },
    {
      href: "/upload",
      label: "Upload Video",
      icon: <Upload className="w-4 h-4 mr-2" />,
      badge: "New",
    },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-sm transition-all group-hover:scale-105">
                <Video className="h-5 w-5" />
              </div>
              <div className="ml-2.5 flex flex-col">
                <span className="text-lg font-medium tracking-tight leading-none">Video Q&A</span>
                <span className="text-xs text-muted-foreground">AI-powered video chat</span>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {user && (
              <div className="flex items-center space-x-1.5 mr-2">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive(link.href) ? "secondary" : "ghost"}
                      size="sm"
                      className="flex items-center h-9 px-3 relative"
                    >
                      {link.icon}
                      <span>{link.label}</span>
                      {link.badge && (
                        <Badge className="absolute -top-1 -right-1 px-1.5 h-5 bg-primary text-[10px]">
                          {link.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                ))}
              </div>
            )}

            {/* User profile dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 flex items-center gap-2 h-9 border-muted/60 shadow-sm"
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User profile"}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {(user.name?.charAt(0) || "U").toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{user.name?.split(' ')[0]}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-lg">
                  <DropdownMenuLabel className="font-normal">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="h-9">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="h-9 shadow-sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <div className="flex items-center md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] px-5 py-6">
                <SheetHeader className="text-left pb-6">
                  <SheetTitle className="text-xl font-bold flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Video Q&A
                  </SheetTitle>
                  {user && (
                    <SheetDescription className="mt-4">
                      <div className="flex items-center p-3 bg-muted/50 rounded-lg">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || "User"}
                            width={40}
                            height={40}
                            className="rounded-full border-2 border-background"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium border-2 border-background">
                            {(user.name?.charAt(0) || "U").toUpperCase()}
                          </div>
                        )}
                        <div className="ml-3">
                          <p className="font-medium text-foreground">
                            {user.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </SheetDescription>
                  )}
                </SheetHeader>

                <div className="py-1">
                  <h3 className="text-xs font-medium text-muted-foreground mb-2 pl-1">NAVIGATION</h3>
                  <Separator className="mb-2" />
                </div>
                
                <div className="space-y-1">
                  {user ? (
                    <>
                      {navLinks.map((link) => (
                        <SheetClose key={link.href} asChild>
                          <Link
                            href={link.href}
                            className={cn(
                              "flex items-center py-2.5 px-3 text-sm rounded-md w-full relative",
                              isActive(link.href)
                                ? "bg-secondary text-secondary-foreground font-medium"
                                : "hover:bg-accent transition-colors"
                            )}
                          >
                            {link.icon}
                            {link.label}
                            {link.badge && (
                              <Badge className="ml-auto px-1.5 h-5 bg-primary text-[10px]">
                                {link.badge}
                              </Badge>
                            )}
                          </Link>
                        </SheetClose>
                      ))}
                      
                      <div className="py-1 mt-4">
                        <h3 className="text-xs font-medium text-muted-foreground mb-2 pl-1">ACCOUNT</h3>
                        <Separator className="mb-2" />
                      </div>
                      
                      <Button
                        variant="ghost"
                        className="flex w-full justify-start py-2.5 px-3 text-sm rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Link href="/auth/login">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Log in
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/auth/register">
                          <Button className="w-full mt-2 shadow-sm">Sign up</Button>
                        </Link>
                      </SheetClose>
                    </>
                  )}
                </div>
                
                <SheetFooter className="mt-8 flex-col items-start">
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-xs text-muted-foreground">© 2025 Video Q&A</span>
                  </div>
                </SheetFooter>
                
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;