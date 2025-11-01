import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { CreateCompanyModal } from "./CreateCompanyModal";

interface CompanyListProps {
  selectedCompanyId: Id<"companies"> | null;
  onSelectCompany: (id: Id<"companies">) => void;
}

export function CompanyList({ selectedCompanyId, onSelectCompany }: CompanyListProps) {
  const companies = useQuery(api.companies.list) || [];
  const [showCreateModal, setShowCreateModal] = useState(false);

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

      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        + New Company
      </button>

      {showCreateModal && (
        <CreateCompanyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(companyId) => {
            onSelectCompany(companyId);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
