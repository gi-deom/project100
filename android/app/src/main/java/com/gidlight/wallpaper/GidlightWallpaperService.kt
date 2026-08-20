package com.gidlight.wallpaper

import android.graphics.BitmapFactory
import android.graphics.Paint
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.net.URL

class GidlightWallpaperService : WallpaperService() {
    override fun onCreateEngine(): Engine = GidlightEngine()

    private inner class GidlightEngine : Engine() {
        private val scope = CoroutineScope(Dispatchers.IO + Job())
        private var updateJob: Job? = null
        private var running = false
        // Keeps downloads and bitmap work modest for Android 12-era entry-level hardware.
        private var intervalMs = 8 * 60 * 1000L

        override fun onVisibilityChanged(visible: Boolean) {
            running = visible
            if (visible) startUpdates() else updateJob?.cancel()
        }

        override fun onSurfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
            super.onSurfaceChanged(holder, format, width, height)
            drawLatest(holder)
        }

        override fun onSurfaceDestroyed(holder: SurfaceHolder) {
            running = false
            updateJob?.cancel()
            super.onSurfaceDestroyed(holder)
        }

        override fun onDestroy() {
            updateJob?.cancel()
            scope.coroutineContext.cancel()
            super.onDestroy()
        }

        private fun startUpdates() {
            updateJob?.cancel()
            updateJob = scope.launch {
                while (isActive && running) {
                    downloadAndDraw()
                    delay(intervalMs)
                }
            }
        }

        private fun downloadAndDraw() {
            runCatching {
                val api = URL("https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US").readText()
                val relativeUrl = Regex("\\\"url\\\":\\\"([^\\\"]+)").find(api)?.groupValues?.get(1) ?: return
                val bitmap = URL("https://www.bing.com$relativeUrl").openStream().use(BitmapFactory::decodeStream) ?: return
                val canvas = surfaceHolder.lockCanvas() ?: return
                canvas.drawColor(android.graphics.Color.BLACK)
                val scale = maxOf(canvas.width.toFloat() / bitmap.width, canvas.height.toFloat() / bitmap.height)
                val width = bitmap.width * scale
                val height = bitmap.height * scale
                canvas.drawBitmap(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, Paint(Paint.FILTER_BITMAP_FLAG))
                surfaceHolder.unlockCanvasAndPost(canvas)
                bitmap.recycle()
            }
        }

        private fun drawLatest(holder: SurfaceHolder) {
            if (!running) return
            downloadAndDraw()
        }
    }
}
