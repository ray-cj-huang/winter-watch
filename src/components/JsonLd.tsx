/**
 * Structured data for crawlers.
 *
 * `<` is escaped because a `</script>` inside a string would otherwise close
 * the tag early and let the payload run as markup.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
