package com.gidlight.wallpaper

import android.app.Activity
import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Spinner
import android.widget.Switch
import android.widget.TextView
import android.net.Uri

class MainActivity : Activity() {
    private val preferences by lazy { getSharedPreferences("gidlight", MODE_PRIVATE) }
    private lateinit var intervalValue: EditText
    private lateinit var intervalUnit: Spinner
    private lateinit var intervalSummary: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        val queueView = findViewById<LinearLayout>(R.id.queueView)
        val settingsView = findViewById<LinearLayout>(R.id.settingsView)
        val updateView = findViewById<LinearLayout>(R.id.updateView)
        findViewById<Button>(R.id.settingsTab).setOnClickListener { queueView.visibility = View.GONE; settingsView.visibility = View.VISIBLE; updateView.visibility = View.GONE }
        findViewById<Button>(R.id.updateTab).setOnClickListener { queueView.visibility = View.GONE; settingsView.visibility = View.GONE; updateView.visibility = View.VISIBLE }
        findViewById<Button>(R.id.queueTab).setOnClickListener { queueView.visibility = View.VISIBLE; settingsView.visibility = View.GONE; updateView.visibility = View.GONE }
        findViewById<Button>(R.id.checkUpdateButton).setOnClickListener {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://github.com/gi-deom/project100/releases/latest")))
        }
        intervalValue = findViewById(R.id.intervalValue)
        intervalUnit = findViewById(R.id.intervalUnit)
        intervalSummary = findViewById(R.id.intervalSummary)
        intervalValue.setText(preferences.getInt("interval_value", 8).toString())
        intervalUnit.setSelection(preferences.getInt("interval_unit", 1))
        updateIntervalSummary()
        intervalValue.setOnFocusChangeListener { _, hasFocus -> if (!hasFocus) saveInterval() }
        intervalUnit.setOnItemSelectedListener(SimpleItemSelectedListener { saveInterval() })

        val desktopToggle = findViewById<Switch>(R.id.desktopToggle)
        val lockToggle = findViewById<Switch>(R.id.lockToggle)
        desktopToggle.isChecked = preferences.getBoolean("desktop", true)
        lockToggle.isChecked = preferences.getBoolean("lock", true)
        desktopToggle.setOnCheckedChangeListener { _, checked -> preferences.edit().putBoolean("desktop", checked).apply() }
        lockToggle.setOnCheckedChangeListener { _, checked -> preferences.edit().putBoolean("lock", checked).apply() }

        findViewById<Button>(R.id.chooseWallpaperButton).setOnClickListener {
            val component = ComponentName(this, GidlightWallpaperService::class.java)
            startActivity(Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER).apply {
                putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT, component)
            })
        }
    }

    private fun saveInterval() {
        val value = intervalValue.text.toString().toIntOrNull()?.coerceAtLeast(1) ?: 1
        intervalValue.setText(value.toString())
        preferences.edit().putInt("interval_value", value).putInt("interval_unit", intervalUnit.selectedItemPosition).apply()
        updateIntervalSummary()
    }

    private fun updateIntervalSummary() {
        val units = arrayOf("seconds", "minutes", "hours", "days")
        intervalSummary.text = "${intervalValue.text} ${units[intervalUnit.selectedItemPosition]}"
    }

    private class SimpleItemSelectedListener(private val onSelected: () -> Unit) : android.widget.AdapterView.OnItemSelectedListener {
        override fun onItemSelected(parent: android.widget.AdapterView<*>?, view: View?, position: Int, id: Long) = onSelected()
        override fun onNothingSelected(parent: android.widget.AdapterView<*>?) = Unit
    }
}
