import { FormField } from '@/types/trip';
import DynamicForm from '@/components/trips/DynamicForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormPreviewProps {
  fields: FormField[];
  tripTitle: string;
}

const FormPreview = ({ fields, tripTitle }: FormPreviewProps) => {
  const validFields = fields.filter(f => f.label.trim());

  if (validFields.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Lägg till fält för att se förhandsgranskning</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{tripTitle || 'Förhandsgranskning'}</CardTitle>
      </CardHeader>
      <CardContent>
        <DynamicForm
          fields={validFields}
          onSubmit={() => {}}
          isSubmitting={false}
        />
      </CardContent>
    </Card>
  );
};

export default FormPreview;
