import { FormField } from '@/types/trip';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FormFieldEditor from './FormFieldEditor';

interface SortableFieldProps {
  field: FormField;
  onChange: (field: FormField) => void;
  onRemove: () => void;
}

const SortableField = ({ field, onChange, onRemove }: SortableFieldProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <FormFieldEditor
        field={field}
        onChange={onChange}
        onRemove={onRemove}
        dragHandleProps={listeners}
      />
    </div>
  );
};

interface FormFieldListProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const FormFieldList = ({ fields, onChange }: FormFieldListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      onChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const updateField = (idx: number, field: FormField) => {
    const updated = [...fields];
    updated[idx] = field;
    onChange(updated);
  };

  const removeField = (idx: number) => {
    onChange(fields.filter((_, i) => i !== idx));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {fields.map((field, idx) => (
            <SortableField
              key={field.id}
              field={field}
              onChange={f => updateField(idx, f)}
              onRemove={() => removeField(idx)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default FormFieldList;
