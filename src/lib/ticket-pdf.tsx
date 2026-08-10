// Explicit React import: this module renders JSX outside the Next.js request
// pipeline (react-pdf runs it directly), where the automatic JSX runtime is
// not applied — without this, rendering fails with "React is not defined".
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { SITE } from "./constants";
import { generateQrDataUrl } from "./qrcode";
import type { EventView } from "./events";

export type TicketData = {
  ticketId: string;
  orderNumber: string;
  /** Ticket type, e.g. "Standard Ticket". General admission — no seat. */
  tierName: string;
  purchaserName: string;
};

const NAVY = "#0a1733";
const GOLD = "#c9a14a";

const styles = StyleSheet.create({
  page: {
    // Tight padding so the whole ticket fits one A5 landscape page —
    // any overflow pushes the footer onto a blank second page.
    paddingTop: 24,
    paddingHorizontal: 30,
    paddingBottom: 24,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
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
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  details: {
    flex: 1,
    paddingRight: 20,
  },
  row: {
    marginBottom: 9,
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
  tierBadge: {
    fontSize: 18,
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
    paddingHorizontal: 24,
    paddingVertical: 9,
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
  event,
  qrDataUrl,
}: {
  ticket: TicketData;
  event: EventView;
  qrDataUrl: string;
}) {
  const timing = event.doorsTime
    ? `Doors ${event.doorsTime} · Start ${event.startTime}`
    : `Start ${event.startTime}`;
  return (
    <Document
      title={`Ticket ${ticket.ticketId}`}
      author="commontone"
      subject={event.name}
    >
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.ticket}>
          <View style={styles.header}>
            <Text style={styles.eventName}>{event.name}</Text>
            {event.subtitle ? (
              <Text style={styles.subtitle}>{event.subtitle}</Text>
            ) : null}
          </View>

          <View style={styles.body}>
            <View style={styles.details}>
              <View style={styles.row}>
                <Text style={styles.label}>Admission</Text>
                <Text style={styles.tierBadge}>{ticket.tierName}</Text>
                <Text style={{ fontSize: 9, color: "#7a869c", marginTop: 2 }}>
                  Open seating
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{event.dateLong}</Text>
                <Text style={{ fontSize: 9, color: "#7a869c", marginTop: 1 }}>
                  {timing}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Venue</Text>
                <Text style={styles.value}>{event.venue.name}</Text>
                <Text style={{ fontSize: 9, color: "#7a869c", marginTop: 1 }}>
                  {event.venue.street}, {event.venue.postalCode}{" "}
                  {event.venue.city}
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

/** Renders one admission ticket to a PDF Buffer. */
export async function renderTicketPdf(
  ticket: TicketData,
  event: EventView,
): Promise<Buffer> {
  const qrDataUrl = await generateQrDataUrl(ticket.ticketId);
  return renderToBuffer(
    <TicketDocument ticket={ticket} event={event} qrDataUrl={qrDataUrl} />,
  );
}
