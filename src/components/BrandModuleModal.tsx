import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface BrandModuleModalProps {
  companyId: Id<"companies">;
  moduleType: "foundations" | "visual" | "verbal" | "applications" | "governance";
  title: string;
  data?: any;
  onClose: () => void;
}

export function BrandModuleModal({
  companyId,
  moduleType,
  title,
  data,
  onClose,
}: BrandModuleModalProps) {
  const [editedData, setEditedData] = useState(data || {});
  const [isSaving, setIsSaving] = useState(false);
  const updateModule = useMutation(api.brandModules.updateModule);

  useEffect(() => {
    setEditedData(data || {});
  }, [data]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateModule({
        companyId,
        type: moduleType,
        data: editedData,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditor = () => {
    if (!data) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">AI is generating this module...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {Object.entries(editedData).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            {typeof value === 'string' ? (
              value.length > 100 ? (
                <textarea
                  value={value}
                  onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                  rows={4}
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              )
            ) : Array.isArray(value) ? (
              <div className="space-y-2">
                {value.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    value={typeof item === 'string' ? item : JSON.stringify(item)}
                    onChange={(e) => {
                      const newArray = [...value];
                      newArray[index] = e.target.value;
                      setEditedData({ ...editedData, [key]: newArray });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ))}
                <button
                  onClick={() => {
                    setEditedData({
                      ...editedData,
                      [key]: [...value, '']
                    });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add item
                </button>
              </div>
            ) : (
              <textarea
                value={JSON.stringify(value, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setEditedData({ ...editedData, [key]: parsed });
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                rows={6}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {renderEditor()}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !data}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
