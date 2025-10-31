import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";

interface CompanyListProps {
  selectedCompanyId: Id<"companies"> | null;
  onSelectCompany: (id: Id<"companies">) => void;
}

export function CompanyList({ selectedCompanyId, onSelectCompany }: CompanyListProps) {
  const companies = useQuery(api.companies.list) || [];
  const createCompany = useMutation(api.companies.create);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;

    setIsCreating(true);
    try {
      const companyId = await createCompany(formData);
      onSelectCompany(companyId);
      setShowCreateForm(false);
      setFormData({ name: "", description: "", isPublic: false });
      toast.success("Company created! AI is generating your brand identity...");
    } catch (error) {
      toast.error("Failed to create company");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 space-y-2">
      {companies.map((company) => (
        <button
          key={company._id}
          onClick={() => onSelectCompany(company._id)}
          className={`w-full text-left p-3 rounded-lg transition-colors ${
            selectedCompanyId === company._id
              ? "bg-blue-50 border border-blue-200"
              : "hover:bg-gray-50 border border-transparent"
          }`}
        >
          <div className="font-medium text-gray-900 truncate">
            {company.name}
          </div>
          <div className="text-sm text-gray-500 truncate mt-1">
            {company.description}
          </div>
        </button>
      ))}

      {showCreateForm ? (
        <form onSubmit={handleCreate} className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <input
            type="text"
            placeholder="Company name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
          <textarea
            placeholder="Brief company description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
            rows={3}
            required
          />
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="mr-2"
            />
            Public company
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isCreating || !formData.name.trim() || !formData.description.trim()}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          + New Company
        </button>
      )}
    </div>
  );
}
