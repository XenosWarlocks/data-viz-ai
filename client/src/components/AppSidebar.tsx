import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Database, BarChart3, ChevronRight, Settings, Trash2 } from "lucide-react";
import { useProjects, useCreateProject, useCreateColumn, useDeleteProject, useDeleteColumn } from "@/hooks/use-projects";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, createColumnSchema } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProject } from "@/hooks/use-projects";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AppSidebar({ projectId }: { projectId?: string }) {
  const [location, setLocation] = useLocation();
  const { data: projects, isLoading } = useProjects();
  const { data: activeProject } = useProject(projectId);

  const getActiveColumnId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("columnId");
  };
  const activeColumnId = getActiveColumnId();

  return (
    <aside className="w-64 border-r border-border bg-sidebar h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">DataViz.ai</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</h3>
            <CreateProjectDialog />
          </div>
          
          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-2 px-2">
                {[1,2,3].map(i => <div key={i} className="h-9 bg-muted/50 rounded-md animate-pulse" />)}
              </div>
            ) : projects?.length === 0 ? (
              <div className="text-sm text-muted-foreground px-2 py-4 text-center border border-dashed rounded-lg">
                No projects yet
              </div>
            ) : (
              projects?.map((project) => (
                <div key={project.id} className="group relative flex items-center">
                   <Link
                    href={`/project/${project.id}`}
                    className={cn(
                      "flex-1 flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all",
                      projectId === project.id 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="truncate">{project.name}</span>
                    {projectId === project.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                  <DeleteProjectButton id={project.id} name={project.name} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columns Section (Only if project selected) */}
        {projectId && activeProject && (
          <div className="animate-in-fade">
            <div className="flex items-center justify-between mb-4 px-2 pt-4 border-t border-border/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Columns</h3>
              <CreateColumnDialog projectId={projectId} />
            </div>

            <div className="space-y-1">
              {activeProject.columns.length === 0 ? (
                <div className="text-sm text-muted-foreground px-2 py-4 text-center border border-dashed rounded-lg">
                  Add columns to start
                </div>
              ) : (
                activeProject.columns.map((col) => (
                  <div key={col.id} className="group relative flex items-center">
                    <button
                      onClick={() => setLocation(`/project/${projectId}?columnId=${col.id}`)}
                      className={cn(
                        "flex-1 flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all text-left w-full",
                        activeColumnId === col.id
                          ? "bg-accent/10 text-accent" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Database className="w-4 h-4" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate">{col.name}</span>
                        <span className="text-[10px] opacity-70 font-mono uppercase">{col.type}</span>
                      </div>
                    </button>
                    <DeleteColumnButton projectId={projectId} columnId={col.id} name={col.name} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border bg-sidebar-accent/5">
        <div className="flex items-center gap-3 px-2 py-2 text-sm text-muted-foreground">
          <Settings className="w-4 h-4" />
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}

function CreateProjectDialog() {
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
        toast({ title: "Project created", description: "Ready to add data." });
        setLocation(`/project/${project.id}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/20 hover:text-primary">
          <Plus className="w-4 h-4" />
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl><Input placeholder="Brief details..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={createProject.isPending} className="w-full">
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CreateColumnDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createColumn = useCreateColumn();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(createColumnSchema),
    defaultValues: { name: "", type: "categorical" as const },
  });

  const onSubmit = (data: any) => {
    createColumn.mutate({ projectId, data }, {
      onSuccess: (col) => {
        setOpen(false);
        form.reset();
        toast({ title: "Column added", description: "Start pasting data." });
        setLocation(`/project/${projectId}?columnId=${col.id}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent/20 hover:text-accent">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Data Column</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Column Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Revenue, Region, Year" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="categorical">Categorical (Text/Labels)</SelectItem>
                      <SelectItem value="numeric">Numeric (Values)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={createColumn.isPending} className="w-full">
              {createColumn.isPending ? "Adding..." : "Add Column"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProjectButton({ id, name }: { id: string, name: string }) {
  const deleteProject = useDeleteProject();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute right-1 hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <b>{name}</b>? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              deleteProject.mutate(id, {
                onSuccess: () => {
                  toast({ title: "Project deleted" });
                  setLocation('/');
                }
              });
            }}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteColumnButton({ projectId, columnId, name }: { projectId: string, columnId: string, name: string }) {
  const deleteColumn = useDeleteColumn();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute right-1 hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Column?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <b>{name}</b>? All data will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              deleteColumn.mutate({ projectId, columnId }, {
                onSuccess: () => {
                  toast({ title: "Column deleted" });
                  setLocation(`/project/${projectId}`);
                }
              });
            }}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
