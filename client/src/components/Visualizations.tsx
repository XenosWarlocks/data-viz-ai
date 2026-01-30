import { Project, Column } from "@shared/schema";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export function VisualizationCanvas({ project, activeColumnId }: { project: Project & { columns: Column[] }, activeColumnId: string | null }) {
  
  // Logic to determine available data structure
  // 1. Single Categorical -> Distribution
  // 2. Single Numeric -> Histogram / Sequence
  // 3. Mixed -> Grouped Aggregates

  const activeColumn = project.columns.find(c => c.id === activeColumnId);
  const numericColumns = project.columns.filter(c => c.type === 'numeric' && c.data.length > 0);
  const categoricalColumns = project.columns.filter(c => c.type === 'categorical' && c.data.length > 0);

  // If no columns have data
  if (project.columns.every(c => c.data.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
        <p>Add data to columns to see visualizations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suggestion 1: Active Categorical Column Distribution */}
        {activeColumn && activeColumn.type === 'categorical' && activeColumn.data.length > 0 && (
          <SingleCategoricalChart column={activeColumn} />
        )}

        {/* Suggestion 2: Active Numeric Column Distribution */}
        {activeColumn && activeColumn.type === 'numeric' && activeColumn.data.length > 0 && (
          <SingleNumericChart column={activeColumn} />
        )}

        {/* Suggestion 3: Multi-column Analysis (if we have multiple) */}
        {categoricalColumns.length > 0 && numericColumns.length > 0 && (
          <MixedDataChart catCol={categoricalColumns[0]} numCol={numericColumns[0]} />
        )}

        {/* Suggestion 4: Scatter (if 2 numeric) */}
        {numericColumns.length >= 2 && (
          <ScatterCorrelationChart xCol={numericColumns[0]} yCol={numericColumns[1]} />
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// CHART COMPONENTS
// ----------------------------------------------------------------------

function SingleCategoricalChart({ column }: { column: Column }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    column.data.forEach(val => {
      const v = String(val);
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [column.data]);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full" />
          {column.name} Distribution
        </CardTitle>
        <CardDescription>Top 10 most frequent values</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <Tabs defaultValue="bar" className="h-full flex flex-col">
          <div className="flex justify-end mb-2">
            <TabsList className="grid w-[120px] grid-cols-2 h-7">
              <TabsTrigger value="bar" className="text-xs">Bar</TabsTrigger>
              <TabsTrigger value="pie" className="text-xs">Pie</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="bar" className="flex-1 mt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="pie" className="flex-1 mt-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function SingleNumericChart({ column }: { column: Column }) {
  const data = useMemo(() => {
    // Simple sequence for line chart
    return column.data.map((val, idx) => ({ index: idx + 1, value: Number(val) }));
  }, [column.data]);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-2 h-6 bg-accent rounded-full" />
          {column.name} Trends
        </CardTitle>
        <CardDescription>Sequential values visualization</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
            <XAxis dataKey="index" tick={{ fontSize: 10 }} stroke="#888888" />
            <YAxis tick={{ fontSize: 10 }} stroke="#888888" />
            <Tooltip 
               contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--accent))" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function MixedDataChart({ catCol, numCol }: { catCol: Column, numCol: Column }) {
  const data = useMemo(() => {
    const minLen = Math.min(catCol.data.length, numCol.data.length);
    const groups: Record<string, { sum: number, count: number }> = {};
    
    for (let i = 0; i < minLen; i++) {
      const cat = String(catCol.data[i]);
      const val = Number(numCol.data[i]);
      if (!groups[cat]) groups[cat] = { sum: 0, count: 0 };
      groups[cat].sum += val;
      groups[cat].count += 1;
    }

    return Object.entries(groups)
      .map(([name, { sum, count }]) => ({ 
        name, 
        avg: Math.round((sum / count) * 100) / 100 
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);
  }, [catCol.data, numCol.data]);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-full" />
          Average {numCol.name} by {catCol.name}
        </CardTitle>
        <CardDescription>Aggregated insights</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#888888" />
            <YAxis tick={{ fontSize: 10 }} stroke="#888888" />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
            <Bar dataKey="avg" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ScatterCorrelationChart({ xCol, yCol }: { xCol: Column, yCol: Column }) {
  const data = useMemo(() => {
    const minLen = Math.min(xCol.data.length, yCol.data.length);
    const points = [];
    for (let i = 0; i < minLen; i++) {
      points.push({ x: Number(xCol.data[i]), y: Number(yCol.data[i]) });
    }
    return points;
  }, [xCol.data, yCol.data]);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-2 h-6 bg-orange-500 rounded-full" />
          {xCol.name} vs {yCol.name}
        </CardTitle>
        <CardDescription>Correlation analysis</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid opacity={0.1} />
            <XAxis type="number" dataKey="x" name={xCol.name} tick={{ fontSize: 10 }} stroke="#888888" label={{ value: xCol.name, position: 'bottom', offset: 0, fontSize: 12 }} />
            <YAxis type="number" dataKey="y" name={yCol.name} tick={{ fontSize: 10 }} stroke="#888888" label={{ value: yCol.name, angle: -90, position: 'left', offset: 0, fontSize: 12 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
            <Scatter name="Points" data={data} fill="#f97316" />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
