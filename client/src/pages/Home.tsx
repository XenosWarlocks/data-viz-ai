import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Wand2, Share2, Layout } from "lucide-react";
import { useCreateProject } from "@/hooks/use-projects";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Home() {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Hero Section */}
          <section className="text-center space-y-6 pt-12 pb-8 animate-in-fade">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <BarChart3 className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight">
              Turn messy data into <br/>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">beautiful insights</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Paste your raw data, clean categories instantly, and generate professional charts in seconds. No spreadsheet headaches.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <CreateProjectButton />
              <Button variant="outline" size="lg" className="rounded-xl px-8">View Demo</Button>
            </div>
          </section>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Layout className="w-6 h-6 text-blue-500" />}
              title="Paste & Organize"
              description="Simply paste CSV or lists. We structure it into columns automatically."
            />
            <FeatureCard 
              icon={<Wand2 className="w-6 h-6 text-purple-500" />}
              title="Clean & Merge"
              description="Fix inconsistent labels like 'USA' and 'U.S.A.' with one click."
            />
            <FeatureCard 
              icon={<Share2 className="w-6 h-6 text-green-500" />}
              title="Visualize"
              description="Get instant chart suggestions based on your data type."
            />
          </div>

          {/* Screenshot/Preview Placeholder */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden aspect-video relative group">
             {/* Abstract UI representation */}
             <div className="absolute inset-0 bg-gradient-to-br from-background to-muted flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-3/4 opacity-50 blur-[1px] group-hover:blur-0 transition-all duration-500">
                  <div className="h-32 bg-primary/20 rounded-lg"></div>
                  <div className="h-32 bg-accent/20 rounded-lg"></div>
                  <div className="h-32 bg-secondary/20 rounded-lg col-span-2"></div>
                </div>
             </div>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="px-4 py-2 bg-background/80 backdrop-blur rounded-full text-sm font-medium border shadow-sm">
                  Interactive Dashboard
                </span>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="hover:-translate-y-1 transition-transform duration-300 border-border/50 shadow-sm hover:shadow-md">
      <CardHeader>
        <div className="mb-2 p-2 w-fit rounded-lg bg-muted">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function CreateProjectButton() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createProject = useCreateProject();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = (data: any) => {
    createProject.mutate(data, {
      onSuccess: (project) => {
        setOpen(false);
        form.reset();
        toast({ title: "Project created", description: "Let's add some data." });
        setLocation(`/project/${project.id}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-xl px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30">
          <Plus className="w-5 h-5 mr-2" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="Q3 Sales Analysis" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={createProject.isPending} className="w-full">
              {createProject.isPending ? "Creating..." : "Start Project"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
