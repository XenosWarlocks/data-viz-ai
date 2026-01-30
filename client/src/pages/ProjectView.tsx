import { AppSidebar } from "@/components/AppSidebar";
import { VisualizationCanvas } from "@/components/Visualizations";
import { useProject, useUpdateColumnData, useMergeTerms } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, FileSpreadsheet, Merge, AlertCircle, Wand2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function ProjectView() {
  const [, params] = useRoute("/project/:id");
  const projectId = params?.id;
  
  // Query param handling
  const searchParams = new URLSearchParams(window.location.search);
  const activeColumnId = searchParams.get("columnId");

  const { data: project, isLoading, error } = useProject(projectId);
  const activeColumn = project?.columns.find(c => c.id === activeColumnId);

  if (isLoading) return <LoadingState />;
  if (error || !project) return <ErrorState />;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar projectId={projectId} />
      
      <main className="flex-1 ml-64 h-full flex flex-col min-w-0">
        <header className="px-8 py-6 border-b border-border bg-card/50 backdrop-blur-sm z-10">
          <h1 className="text-2xl font-bold font-display">{project.name}</h1>
          <p className="text-muted-foreground text-sm">{project.description || "No description provided."}</p>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
          
          {/* Top Section: Data Input */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <DataInputCard project={project} activeColumn={activeColumn} />
            </div>
            
            <div className="lg:col-span-2">
               {activeColumn?.type === 'categorical' && activeColumn.data.length > 0 ? (
                 <MergeTermsCard project={project} activeColumn={activeColumn} />
               ) : (
                 <DataStatsCard activeColumn={activeColumn} />
               )}
            </div>
          </section>

          {/* Bottom Section: Visualization */}
          <section>
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display">Visual Insights</h2>
                  <p className="text-sm text-muted-foreground">Auto-generated based on your columns.</p>
                </div>
             </div>
             <VisualizationCanvas project={project} activeColumnId={activeColumnId} />
          </section>

          <div className="h-12" /> {/* Spacer */}
        </div>
      </main>
    </div>
  );
}

function DataInputCard({ project, activeColumn }: { project: any, activeColumn: any }) {
  const [input, setInput] = useState("");
  const updateData = useUpdateColumnData();
  const { toast } = useToast();

  useEffect(() => {
    if (activeColumn) {
      // Convert data array back to string for editing
      setInput(activeColumn.data.join("\n"));
    } else {
      setInput("");
    }
  }, [activeColumn]);

  const handleSave = () => {
    if (!activeColumn) return;
    
    updateData.mutate({
      projectId: project.id,
      columnId: activeColumn.id,
      data: { rawInput: input }
    }, {
      onSuccess: () => {
        toast({ title: "Data updated", description: "Visualizations refreshed." });
      }
    });
  };

  if (!activeColumn) {
    return (
      <Card className="h-full border-dashed flex items-center justify-center p-6 bg-muted/20">
        <div className="text-center text-muted-foreground">
           <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-50" />
           <p>Select a column to edit data</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Input Data: {activeColumn.name}</CardTitle>
            <CardDescription className="text-xs">Paste values (one per line or CSV)</CardDescription>
          </div>
          <Badge variant="outline" className="uppercase text-[10px]">{activeColumn.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 min-h-[300px]">
        <Textarea 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 font-mono text-sm resize-none bg-muted/30 focus:bg-background transition-colors"
          placeholder={`Paste ${activeColumn.type} data here...`}
        />
        <Button 
          onClick={handleSave} 
          disabled={updateData.isPending}
          className="w-full shadow-md shadow-primary/20"
        >
          {updateData.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Update Data
        </Button>
      </CardContent>
    </Card>
  );
}

function MergeTermsCard({ project, activeColumn }: { project: any, activeColumn: any }) {
  // Compute frequencies
  const frequencies = useMemo(() => {
    const counts: Record<string, number> = {};
    activeColumn.data.forEach((val: string) => {
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count);
  }, [activeColumn.data]);

  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const mergeTerms = useMergeTerms();
  const { toast } = useToast();

  const toggleTerm = (term: string) => {
    setSelectedTerms(prev => 
      prev.includes(term) ? prev.filter(t => t !== term) : [...prev, term]
    );
  };

  const handleMerge = () => {
    if (selectedTerms.length < 2) return;
    
    // Default to the first selected term (most frequent usually if user selects top-down)
    // or arguably the shortest/cleanest looking one? Let's just pick the first one selected for now.
    // Ideally we'd show a dialog to pick the "target" term, but let's simplify for now: 
    // Merge ALL selected into the FIRST selected.
    
    const targetTerm = selectedTerms[0];
    
    mergeTerms.mutate({
      projectId: project.id,
      columnId: activeColumn.id,
      data: { originalTerms: selectedTerms, mergedTerm: targetTerm }
    }, {
      onSuccess: () => {
        toast({ title: "Terms merged", description: `Merged ${selectedTerms.length} terms into "${targetTerm}"` });
        setSelectedTerms([]);
      }
    });
  };

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Merge className="w-4 h-4 text-purple-500" />
              Clean Data
            </CardTitle>
            <CardDescription className="text-xs">Select aliases to merge (e.g., "USA", "U.S.A" → "USA")</CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="secondary"
            disabled={selectedTerms.length < 2 || mergeTerms.isPending}
            onClick={handleMerge}
          >
            {mergeTerms.isPending ? "Merging..." : "Merge Selected"}
          </Button>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1 h-[300px]">
        <div className="p-4 space-y-2">
          {frequencies.map(({ term, count }) => (
            <div 
              key={term} 
              className={`flex items-center justify-between p-2 rounded-md transition-colors border ${
                selectedTerms.includes(term) 
                  ? "bg-primary/5 border-primary/30" 
                  : "hover:bg-muted/50 border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={selectedTerms.includes(term)}
                  onCheckedChange={() => toggleTerm(term)}
                />
                <span className="text-sm font-medium">{term}</span>
              </div>
              <Badge variant="secondary" className="text-xs">{count}</Badge>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

function DataStatsCard({ activeColumn }: { activeColumn: any }) {
  if (!activeColumn) return null;

  return (
    <Card className="h-full flex items-center justify-center p-6 bg-muted/10 border-dashed">
      <div className="text-center space-y-2">
         <p className="text-4xl font-bold font-display text-primary">{activeColumn.data.length}</p>
         <p className="text-sm text-muted-foreground uppercase tracking-wider">Total Rows</p>
         
         {activeColumn.type === 'numeric' && activeColumn.data.length > 0 && (
           <div className="pt-4 grid grid-cols-3 gap-4 text-xs">
             <div>
               <div className="font-semibold text-foreground">Min</div>
               <div className="text-muted-foreground">{Math.min(...activeColumn.data)}</div>
             </div>
             <div>
               <div className="font-semibold text-foreground">Max</div>
               <div className="text-muted-foreground">{Math.max(...activeColumn.data)}</div>
             </div>
             <div>
               <div className="font-semibold text-foreground">Avg</div>
               <div className="text-muted-foreground">
                 {(activeColumn.data.reduce((a:number,b:number)=>a+Number(b),0) / activeColumn.data.length).toFixed(1)}
               </div>
             </div>
           </div>
         )}
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 border-r border-border bg-sidebar" />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex h-screen bg-background items-center justify-center">
      <div className="text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="text-muted-foreground">This project may have been deleted.</p>
        <Button variant="outline" asChild>
          <a href="/">Go Home</a>
        </Button>
      </div>
    </div>
  );
}
