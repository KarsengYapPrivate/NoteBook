import { _decorator, Asset, Component, Node, warn } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FindMissingComponent')
export class FindMissingComponent extends Component {
    onLoad() {
        // 开始检测当前节点及其所有子节点的资源引用
        this.checkMissingAssets(this.node);
    }

    /**
     * 递归检查节点及其组件中的资源引用是否缺失。
     */
    private checkMissingAssets(node: Node) {
        const components = node.components;

        // 遍历节点上的所有组件
        components.forEach(component => {
            if (component) {
                this.inspectComponent(component, node.name);
            }
        });

        // 递归检查所有子节点
        node.children.forEach(child => {
            this.checkMissingAssets(child);
        });
    }

    /**
     * 检查单个组件的所有属性，确认是否有 Asset 类型的缺失引用。
     */
    private inspectComponent(component: Component, nodeName: string) {
        for (const key in component) {
            try {
                const value = (component as any)[key];

                // 检查属性是否为 Asset 类型，并且引用为空
                if (value instanceof Asset && !value._uuid) {
                    warn(`⚠️ 缺失资源：节点 "${nodeName}" 中的组件 "${component.name}" 属性 "${key}" 未正确引用资源`);
                }
            } catch (error) {
                warn(`检测组件 "${component.name}" 时发生错误：`, error);
            }
        }
    }

}


