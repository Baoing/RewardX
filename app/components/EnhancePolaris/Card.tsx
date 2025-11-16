import {Card as PolarisCard, Divider, Text} from "@shopify/polaris"

interface CardI {
  title?: string;
  titleRight?: React.ReactNode;
  children?: React.ReactNode;
  titleDivider?: boolean
}
export const Card = ({
  title,
  titleRight,
  children,
  titleDivider
}: CardI) => {
  return <PolarisCard padding="0">
    {
      title && <div className="flex justify-between items-center p-4 pb-2">
        <Text as={"h2"} variant={"headingSm"}>{title}</Text>
        {titleRight}
      </div>
    }
    {titleDivider && <div className={"py-1"}><Divider /></div>}
    <div className="p-4">
      {children}
    </div>
  </PolarisCard>
};


