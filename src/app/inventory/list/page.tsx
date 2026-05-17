
'use client';

import React from 'react';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const InventoryList = () => {
  const { data: items, isFetching } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => (await axios.get('/api/inventory/list')).data
  });

  // Group items by hostgroup_id
  const groupedInventory = items?.reduce((acc: any, item: any) => {
    const groupId = item.hostgroup_id || '0';
    const groupName = item.hostgroup || 'Uncategorized';
    
    if (!acc[groupId]) {
      acc[groupId] = { name: groupName, items: [] };
    }
    acc[groupId].items.push(item);
    return acc;
  }, {});

  return (
    <Block title="Server Inventory" tabs={['List']}>
      <div className="overflow-x-auto">
        {isFetching ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          Object.keys(groupedInventory || {}).map((groupId) => (
            <div key={groupId} className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 bg-gray-100 px-4 py-2 mb-2 rounded">
                {groupedInventory[groupId].name} (ID: {groupId})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-gray-200 mb-4">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-bold">
                      <th className="px-2 py-3 border-r">Hostname</th>
                      <th className="px-2 py-3 border-r">IP</th>
                      <th className="px-2 py-3 border-r">OS</th>
                      <th className="px-2 py-3 border-r">Model</th>
                      <th className="px-2 py-3 border-r">CPU</th>
                      <th className="px-2 py-3 border-r">Disk</th>
                      <th className="px-2 py-3 border-r">Serial</th>
                      <th className="px-2 py-3 border-r">Mem(GB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {groupedInventory[groupId].items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-3 border-r font-medium text-gray-900">{item.hostname}</td>
                        <td className="px-2 py-3 border-r">{item.IP}</td>
                        <td className="px-2 py-3 border-r">{item.OS}</td>
                        <td className="px-2 py-3 border-r">{item.Model}</td>
                        <td className="px-2 py-3 border-r">{item.CPU}</td>
                        <td className="px-2 py-3 border-r">{item.Disk}</td>
                        <td className="px-2 py-3 border-r">{item.Serial}</td>
                        <td className="px-2 py-3">{item.mem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </Block>
  );
};

export default InventoryList;
