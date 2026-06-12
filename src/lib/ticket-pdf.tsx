import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { EVENT } from "./constants";
import { generateQrDataUrl } from "./qrcode";

export type TicketData = {
  ticketId: string;
  orderNumber: string;
  seatLabel: string;
  purchaserName: string;
};

const NAVY = "#0a1733";
const GOLD = "#c9a14a";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingHorizontal: 48,
    paddingBottom: 48,
    fontSize: 11,
    color: NAVY,
    fontFamily: "Helvetica",
  },
  ticket: {
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    backgroundColor: NAVY,
    paddingVertical: 22,
    paddingHorizontal: 28,
  },
  eventName: {
    color: "#ffffff",
    fontSize: 22,
    fontFamily: "Times-Bold",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: GOLD,
    fontSize: 11,
    marginTop: 4,
    fontFamily: "Times-Italic",
  },
  body: {
    flexDirection: "row",
    padding: 28,
  },
  details: {
    flex: 1,
    paddingRight: 20,
  },
  row: {
    marginBottom: 12,
  },
  label: {
    fontSize: 8,
    color: "#7a869c",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    color: NAVY,
    fontFamily: "Helvetica-Bold",
  },
  seatBadge: {
    fontSize: 30,
    color: GOLD,
    fontFamily: "Times-Bold",
  },
  qrBox: {
    width: 150,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  qrImage: {
    width: 140,
    height: 140,
  },
  qrCaption: {
    fontSize: 7,
    color: "#7a869c",
    marginTop: 6,
    textAlign: "center",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e6e9f0",
    borderStyle: "dashed",
    paddingHorizontal: 28,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#7a869c",
  },
});

function TicketDocument({
  ticket,
  qrDataUrl,
}: {
  ticket: TicketData;
  qrDataUrl: string;
}) {
  return (
    <Document
      title={`Ticket ${ticket.ticketId}`}
      author={EVENT.organizer}
      subject={EVENT.name}
    >
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.ticket}>
          <View style={styles.header}>
            <Text style={styles.eventName}>{EVENT.name}</Text>
            <Text style={styles.subtitle}>{EVENT.subtitle}</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.details}>
              <View style={styles.row}>
                <Text style={styles.label}>Seat</Text>
                <Text style={styles.seatBadge}>{ticket.seatLabel}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{EVENT.dateLong}</Text>
                <Text style={{ fontSize: 9, color: "#7a869c", marginTop: 1 }}>
                  Doors {EVENT.doorsTime} · Start {EVENT.startTime}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Venue</Text>
                <Text style={styles.value}>{EVENT.venue.name}</Text>
                <Text style={{ fontSize: 9, color: "#7a869c", marginTop: 1 }}>
                  {EVENT.venue.street}, {EVENT.venue.postalCode}{" "}
                  {EVENT.venue.city}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Ticket Holder</Text>
                <Text style={styles.value}>{ticket.purchaserName}</Text>
              </View>
            </View>

            <View style={styles.qrBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={qrDataUrl} style={styles.qrImage} />
              <Text style={styles.qrCaption}>Scan at entrance</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Order {ticket.orderNumber}</Text>
            <Text style={styles.footerText}>Ticket ID: {ticket.ticketId}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/** Renders a single seat's ticket to a PDF Buffer. */
export async function renderTicketPdf(ticket: TicketData): Promise<Buffer> {
  const qrDataUrl = await generateQrDataUrl(ticket.ticketId);
  return renderToBuffer(
    <TicketDocument ticket={ticket} qrDataUrl={qrDataUrl} />,
  );
}
