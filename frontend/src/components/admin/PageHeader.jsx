/** Title row at the top of every admin page, with room for action buttons. */
const PageHeader = ({ title, subtitle, children }) => (
  <div className="page-header">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </div>
);

export default PageHeader;
