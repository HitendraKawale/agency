// The services body: the sticky index in columns 1-2, the services in 3-12 (Symbol's layout).
import { services } from "@/content/services";
import { IndexNav } from "./index-nav";
import { Service } from "./service";
import s from "./services.module.css";

export { ServicesHead } from "./head";

export function ServicesList() {
  return (
    <div className={`grid-12 ${s.body}`}>
      <IndexNav items={services.services.map(({ id, title }) => ({ id, title }))} />
      <div className={s.list}>
        {services.services.map((svc) => <Service key={svc.id} {...svc} />)}
      </div>
    </div>
  );
}
