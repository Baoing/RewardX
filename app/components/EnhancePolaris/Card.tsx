import {Card as PolarisCard, Divider, Text} from "@shopify/polaris"

interface CardI {
  title?: string;
  titleRight?: React.ReactNode;
  children?: React.ReactNode;
  titleDivider?: boolean
  padding?: "0"|"4"
}
export const Card = ({
  title,
  titleRight,
  children,
  titleDivider,
  padding = "4",
}: CardI) => {
  return <PolarisCard padding="0">
    {
      title && <div className="flex justify-between items-center p-4 pb-2">
        <Text as={"h2"} variant={"headingSm"}>{title}</Text>
        {titleRight}
      </div>
    }
    {titleDivider && <div className={"py-1"}><Divider /></div>}
    <div className={`p-${padding}`}>
      {children}
    </div>
  </PolarisCard>
};


