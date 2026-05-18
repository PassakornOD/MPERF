import Block from '@/components/common/Block';
import CodeBlock from '@/components/common/CodeBlock';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function FaqPage() {
  const session = await getServerSession(authOptions);
  const isSysReport = session?.user?.name === "sysreport";

  return (
    <Block title="FAQ" subtitle="Frequently Asked Questions">
      <div className="space-y-10 text-gray-800">
        {!isSysReport ? (
          <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
             <span className="font-bold text-lg">Permission denied: Access restricted.</span>
          </div>
        ) : (
          <div className="max-w-4xl space-y-12">
            {/* Deploy Section */}
            <section>
              <h2 className="text-2xl font-extrabold text-blue-900 mb-6 border-l-4 border-blue-600 pl-4">Deployment with Docker</h2>
              <div className="space-y-6">
                <p className="text-gray-600">The project is containerized for consistency. Follow these steps:</p>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">1. Build & Start</h4>
                  <CodeBlock code={`cd MPERF\ndocker-compose up -d --build`} className="bg-gray-900 text-green-400" />
                  <p className="text-sm text-gray-500 italic">Builds the application and starts the MySQL database container.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">2. Re-deploy Application</h4>
                  <CodeBlock code={`docker-compose up -d --build mperf-app`} className="bg-gray-900 text-green-400" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">3. Status & Logs</h4>
                  <CodeBlock code={`docker-compose ps\ndocker-compose logs -f mperf-app`} className="bg-gray-900 text-green-400" />
                </div>

                <p className="pt-2">Access: <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">http://localhost:3000</a></p>
              </div>
            </section>

            {/* Management Section */}
            <section>
              <h2 className="text-2xl font-extrabold text-blue-900 mb-6 border-l-4 border-blue-600 pl-4">Hostgroup & Host Management</h2>
              <div className="space-y-6">
                <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 border-b border-gray-200 pb-2">Option 1: Web UI (Recommended)</h3>
              <p className="text-sm text-gray-600 mb-4">The Web UI provides a secure and intuitive interface for managing your infrastructure. Please follow these steps:</p>
              <ol className="list-decimal list-outside ml-4 space-y-4 text-sm text-gray-700">
                <li>
                  <strong className="block mb-1">Navigate to Inventory</strong>
                  In the sidebar, click <strong>Inventory</strong> &gt; <strong>Manage asset</strong> to open the administration dashboard.
                </li>
                <li>
                  <strong className="block mb-1">Add Hostgroup</strong>
                  Navigate to the <strong>Hostgroup</strong> tab to define or update your server groups.
                </li>
                <li>
                  <strong className="block mb-1">Add Hostname & Database</strong>
                  Navigate to the <strong>Hostname</strong> tab to add new hosts and configure their database associations.
                </li>
              </ol>
            </div>

            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-gray-900 border-b border-gray-200 pb-2">Option 2: Direct Database Management</h3>
              <p className="text-sm text-gray-600 mb-4">For administrators using MySQL or phpMyAdmin:</p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-sm text-blue-800">Add Hostgroup</p>
                      <CodeBlock code={`-- SQL Command\nINSERT INTO hostgroup (group_name) VALUES ('new_group');`} className="bg-gray-900 text-green-400 mt-2" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-blue-800">Add Host</p>
                      <CodeBlock code={`INSERT INTO hostname (hostname, hostgroup_id) \nVALUES ('host', [id]);`} className="bg-gray-900 text-green-400 mt-2" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Import & SQL Section */}
            <section>
              <h2 className="text-2xl font-extrabold text-blue-900 mb-6 border-l-4 border-blue-600 pl-4">Database Operations</h2>
              <div className="space-y-8">
                <div>
                  <h4 className="font-bold text-lg mb-3">Sar Data Import</h4>
                  <div className="flex flex-col gap-2">
                    <CodeBlock code={`http://<servername_or_ip>/sar4/sar_u_load.php?hostname=host&hostgroup=group&day=-1`} className="bg-gray-100 text-gray-800" />
                    <CodeBlock code={`http://<servername_or_ip>/sar4/sar_r_load.php?hostname=host&hostgroup=group&day=-1`} className="bg-gray-100 text-gray-800" />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-3">Database Access (CLI)</h4>
                  <CodeBlock code={`docker exec -it mperf-db mysql -u root -p sarlog`} className="bg-gray-900 text-green-400" />
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </Block>
  );
}
