import CsvUploader from '@/components/CsvUploader';
import { Database } from 'lucide-react';

export default function ImportLeadsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Database className="w-7 h-7 text-blue-600" />
                    CSV Lead Import
                </h1>
                <p className="text-gray-500 mt-1">
                    Upload targeted lists directly into your CRM. The system will automatically filter out duplicates and assign new leads to your sales reps via Round-Robin.
                </p>
            </div>

            {/* The component we built in the previous step! */}
            <CsvUploader />
        </div>
    );
}