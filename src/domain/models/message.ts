export type MessageModel = {
  data: {
    color: number;
    title: string;
    url: string;
    author: {
      name: string;
      url: string | null | undefined;
      icon_url: string;
    };
    description: string | null | undefined;
  };
};
