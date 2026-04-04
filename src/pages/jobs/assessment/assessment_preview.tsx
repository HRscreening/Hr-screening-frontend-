import { useLocation } from "react-router-dom";

const PreviewPage = () => {
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const key = params.get("key");

  const criterias = JSON.parse(
    sessionStorage.getItem(key || "") || "[]"
  );

  return (
    <div>
      {criterias.map((c: string, i: number) => (
        <div key={i}>{c}</div>
      ))}
    </div>
  );
};


export default PreviewPage