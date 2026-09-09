import { SocialIcons } from '@/components/SocialIcons'

interface SiteFooterProps {
  bookCount?: number
  chapterCount?: number
}

export default function SiteFooter({
  bookCount,
  chapterCount,
}: SiteFooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer
      data-read-aloud-ignore
      className="mt-10 border-t border-pine-600/80 dark:border-ocean-700/80 bg-gradient-to-b from-transparent to-pine-700/40 dark:to-ocean-950/60"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display font-semibold text-lg text-pine-50 dark:text-ocean-50 mb-3">
              What Jesus Said
            </h2>

            {bookCount != null && chapterCount != null && (
              <p className="font-sans text-sm text-pine-300 dark:text-ocean-400">
                World English Bible · {bookCount} Books · {chapterCount} Chapters
              </p>
            )}
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-pine-50 dark:text-ocean-50 mb-4">
              Connect with Raimon
            </h2>

            <SocialIcons />
          </div>
        </div>

        <div className="border-t border-pine-600/80 dark:border-ocean-700/80 mt-8 pt-8 text-center">
          <p className="font-sans text-sm text-pine-300 dark:text-ocean-400">
            &copy; {year}{' '}
            <a
              href="https://github.com/raimonvibe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pine-100 dark:text-ocean-200 hover:underline"
            >
              raimonvibe
            </a>
            . MIT License.
          </p>
        </div>
      </div>
    </footer>
  )
}