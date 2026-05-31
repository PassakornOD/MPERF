const Footer = () => {
  return (
    <footer className="w-full py-8 text-center bg-transparent border-t border-gray-100/50">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-sm font-medium text-gray-400">
          &copy; {new Date().getFullYear()} Metrisar Dashboard &bull; Designed by Passakorn Jonlapon
        </p>
      </div>
    </footer>
  );
};

export default Footer;
