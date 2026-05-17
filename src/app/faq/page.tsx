
import Block from '@/components/common/Block';

export default function FaqPage() {
  return (
    <Block title="FAQ" subtitle="Frequently Asked Questions">
      <div className="space-y-4 text-gray-700">
        <h3 className="font-bold">What is Metrisar?</h3>
        <p>Metrisar is a performance monitoring dashboard for your server infrastructure.</p>
        
        <h3 className="font-bold">How to query data?</h3>
        <p>Select your hostgroup, hostname, and the desired date range, then click Query.</p>
      </div>
    </Block>
  );
}
