---
title: Home
layout: home
tags: page
modified: 2022-01-09 00:00:00
order: 1
---

{% import 'macro-post-card.njk' as macro %}

<div class="container max-w-screen-lg mx-auto text-xl">
	<div class="dark:bg-blue-400 bg-slate-900 duration-200 rounded-md m-2">
		<div class="py-10 px-4 bg-purple-400
			text-white
			dark:bg-yellow-300
			dark:text-purple-500
			border-slate-900
            border-2
			rounded-md
			-translate-x-2 
            -translate-y-2 
			text-8xl font-bold">
			Hello there 👋
		</div>
	</div>
	<div>
		<!-- <div class="py-4">Posts</div> -->
		<div class="flex flex-row flex-wrap">
		{%- for post in collections.posts -%}
		<a class="hover:no-underline w-1/2" href="{{post.url}}">
			{{ macro.card(post.data) }}
		</a>
		{%- endfor -%}
		</div>
	</div>
	<br/>
	<br/>
	<br/>
</div>

{% include "navigation.njk" %}
