import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {v4 as uuid} from 'uuid'
import {completion} from '../../ml/node/openai'
import {z} from 'zod'
// @ts-ignore
import dayjs from 'dayjs'
import {reduce as _reduce} from "lodash"
import type {Entry} from '@gnothi/schemas/entries'
import type {insights_ask_response, insights_themes_response, insights_summarize_response} from '@gnothi/schemas/insights'
import {summarize, summarizeInsights} from '../../ml/node/summarize'
import {search} from '../../ml/node/search'
import {books} from '../../ml/node/books'
import {ask} from '../../ml/node/ask'
import {themes} from '../../ml/node/themes'
import {boolMapToKeys} from '@gnothi/schemas/utils'
import {Insights} from '../../data/models/insights'

const r = S.Routes.routes
