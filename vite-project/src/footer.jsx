const Footer = () => {
  return (
    <footer className="w-full bg-gray-800 border-t border-gray-700 text-center text-gray-400 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <p className="text-xs md:text-sm">© {new Date().getFullYear()} Parking Management System</p>
        <p className="text-xs mt-2">Powered by React & Tailwind CSS</p>
      </div>
    </footer>
  );
};

export default Footer;
