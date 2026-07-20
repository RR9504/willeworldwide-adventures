import { Link } from 'react-router-dom';
import { FileText, ChevronRight, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { editablePages } from '@/data/editableContent';

const ContentPagesPage = () => (
  <div className="flex min-h-screen flex-col bg-muted/30">
    <Header />
    <main className="container flex-1 py-8">
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Till dashboard
      </Link>

      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">Redigera innehåll</h1>
        <p className="text-sm text-muted-foreground">
          Välj en sida för att ändra dess texter och publicera direkt.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {editablePages.map((page) => (
          <Link key={page.slug} to={`/dashboard/innehall/${page.slug}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-accent p-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{page.name}</p>
                  <p className="text-sm text-muted-foreground">{page.path}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  </div>
);

export default ContentPagesPage;
