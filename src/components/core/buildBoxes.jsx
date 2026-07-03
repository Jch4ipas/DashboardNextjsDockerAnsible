import { registry } from "@/components/core/registry";

export function buildBoxes(serializedBoxes) {
  return serializedBoxes.map((box) => {
    const Component = registry[box.type];
    return {
      ...box,
      content: Component ? <Component {...(box.props || {})} /> : <></>,
    };
  });
}
