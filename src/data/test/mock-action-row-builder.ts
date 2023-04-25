import {
  ActionRowBuilder,
  APIActionRowComponent,
  RestOrArray,
  AnyComponentBuilder,
  ComponentType,
  APIButtonComponent,
  ComponentBuilder
} from 'discord.js';

// eslint-disable-next-line @typescript-eslint/array-type
function normalizeArray(arr): Array<any> {
  if (Array.isArray(arr[0])) {
    return arr[0];
  }
  return arr;
}

export const mockActionRowBuilder = (): ActionRowBuilder<AnyComponentBuilder> => {
  class ActionRowBuilderStub extends ComponentBuilder implements ActionRowBuilder {
    data: { type: ComponentType.ActionRow } = { type: ComponentType.ActionRow };
    components: AnyComponentBuilder[] = [];

    constructor({ components, ...data } = { components: [] }) {
      super({
        type: ComponentType.ActionRow,
        ...data
      });
      this.components = (components?.map(component => new ActionRowBuilder(component)) ??
        []) as unknown as AnyComponentBuilder[];
    }

    addComponents(...components: RestOrArray<AnyComponentBuilder>): this {
      this.components.push(...normalizeArray(components));
      return this;
    }

    setComponents(...components: RestOrArray<AnyComponentBuilder>): this {
      this.components.splice(0, this.components.length, ...normalizeArray(components));
      return this;
    }

    toJSON(): APIActionRowComponent<ReturnType<AnyComponentBuilder['toJSON']>> {
      return {
        ...this.data,
        components: this.components.map(component => component.toJSON()) as unknown as APIButtonComponent[]
      };
    }
  }
  return new ActionRowBuilderStub();
};
